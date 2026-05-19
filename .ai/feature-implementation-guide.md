# Feature Implementation Guide

## How to Add a New Feature (Step-by-Step)

### Phase 1: Design & Planning

#### 1.1 Define Feature Scope

- **What**: What does the feature do?
- **Why**: What business problem does it solve?
- **Who**: Which users interact with it?
- **When**: Is it urgent or can it be prioritized?

Example: User Registration Feature

```
What: Allow users to create accounts with email/phone
Why: Need user base for ride booking
Who: New customers and drivers
When: MVP feature (high priority)
```

#### 1.2 Identify Data Model

- What data needs to be stored?
- What relationships exist?
- What indexes are needed?

Example: User model

```typescript
interface User {
  _id: ObjectId;
  email: string; // indexed, unique
  phone: string; // indexed, unique
  passwordHash: string; // not returned
  name: string;
  role: "user" | "driver";
  isVerified: boolean; // indexed
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // soft delete
}
```

#### 1.3 Define API Endpoints

- Route pattern and HTTP method
- Request format (body, params, query)
- Response format
- Status codes

Example: User Endpoints

```
POST /api/v1/users
  - Create new user
  - Request: { email, phone, password, name, role }
  - Response: 201 { success: true, data: { id, email, name, role } }
  - Errors: 400 (validation), 409 (duplicate)

GET /api/v1/users/:userId
  - Get user by ID
  - Request: (none)
  - Response: 200 { success: true, data: { id, email, name, role } }
  - Errors: 404 (not found), 401 (unauthorized)

PUT /api/v1/users/:userId
  - Update user profile
  - Request: { name?, email?, phone? }
  - Response: 200 { success: true, data: { id, email, name, role } }
  - Errors: 400 (validation), 409 (duplicate), 404 (not found)
```

#### 1.4 Identify Dependencies

- Does it need authentication? → Auth middleware
- Does it send emails? → Email service
- Does it use existing data? → Which repositories?
- Does it integrate external APIs? → API client

### Phase 2: Create Data Layer

#### 2.1 Create Schema (schema.ts)

```typescript
// src/modules/users/user.schema.ts

import { Schema, model, Document, ObjectId } from "mongoose";

interface UserSchema extends Document {
  _id: ObjectId;
  email: string;
  phone: string;
  passwordHash: string;
  name: string;
  role: "user" | "driver";
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const userSchema = new Schema<UserSchema>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    // ... other fields
  },
  { timestamps: true },
);

// Add indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ isVerified: 1 });

const User = model<UserSchema>("User", userSchema);
export { User, type UserSchema };
```

**Checklist**:

- ✅ Interface extends Document
- ✅ All fields typed
- ✅ Required fields marked
- ✅ Indexes on queried fields
- ✅ Timestamps added
- ✅ Soft delete field if needed

#### 2.2 Create Types (types.ts)

```typescript
// src/modules/users/user.types.ts

import type { UserSchema } from "./user.schema";

export interface CreateUserRequest {
  email: string;
  phone: string;
  password: string;
  name: string;
  role: "user" | "driver";
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: "user" | "driver";
  isVerified: boolean;
  createdAt: Date;
}

// Map database model to response
export const mapUserToResponse = (user: UserSchema): UserResponse => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});
```

**Checklist**:

- ✅ Request DTOs for each endpoint
- ✅ Response DTO matching API contract
- ✅ Mapper function from schema to response

#### 2.3 Create Repository (repository.ts)

```typescript
// src/modules/users/user.repository.ts

import { Model } from "mongoose";
import { BaseRepository } from "../repositories/base.repository";
import type { UserSchema } from "./user.schema";

class UserRepository extends BaseRepository<UserSchema> {
  constructor(model: Model<UserSchema>) {
    super(model);
  }

  async findByEmail(email: string) {
    return this.findOne({ email: email.toLowerCase() });
  }

  async findByPhone(phone: string) {
    return this.findOne({ phone });
  }

  async findByIdActive(id: string) {
    return this.findOne({ _id: id, deletedAt: null });
  }

  async findAllActive() {
    return this.findMany({ deletedAt: null });
  }

  async countByRole(role: string) {
    return this.model.countDocuments({ role, deletedAt: null });
  }
}

export { UserRepository };
```

**Checklist**:

- ✅ Extend BaseRepository
- ✅ Add domain-specific queries
- ✅ Handle soft deletes
- ✅ No business logic (queries only)

### Phase 3: Create Business Logic Layer

#### 3.1 Create Service (service.ts)

```typescript
// src/modules/users/user.service.ts

import { AppError } from "../core/errors/AppError";
import { HTTP_STATUS } from "../constants/statusCodes";
import { UserRepository } from "./user.repository";
import { User } from "./user.schema";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "./user.types";
import { mapUserToResponse } from "./user.types";

class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository(User);
  }

  async createUser(request: CreateUserRequest): Promise<UserResponse> {
    // Validate business rules
    const existingEmail = await this.userRepository.findByEmail(request.email);
    if (existingEmail) {
      throw new AppError("Email already registered", HTTP_STATUS.CONFLICT);
    }

    const existingPhone = await this.userRepository.findByPhone(request.phone);
    if (existingPhone) {
      throw new AppError("Phone already in use", HTTP_STATUS.CONFLICT);
    }

    // Create user
    const passwordHash = await this.hashPassword(request.password);
    const user = await this.userRepository.create({
      email: request.email.toLowerCase(),
      phone: request.phone,
      passwordHash,
      name: request.name,
      role: request.role,
      isVerified: false,
    });

    // Trigger side effects (non-critical)
    try {
      // await emailService.sendVerificationEmail(user.email);
    } catch (error) {
      console.error("Failed to send verification email", error);
    }

    return mapUserToResponse(user);
  }

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findByIdActive(userId);
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return mapUserToResponse(user);
  }

  async updateUser(
    userId: string,
    request: UpdateUserRequest,
  ): Promise<UserResponse> {
    const user = await this.userRepository.findByIdActive(userId);
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    // Validate unique constraints
    if (request.email && request.email !== user.email) {
      const existing = await this.userRepository.findByEmail(request.email);
      if (existing) {
        throw new AppError("Email already in use", HTTP_STATUS.CONFLICT);
      }
    }

    // Update
    const updated = await this.userRepository.updateOne(
      { _id: userId },
      request,
    );

    return mapUserToResponse(updated);
  }

  private async hashPassword(password: string): Promise<string> {
    // TODO: Use bcrypt
    return Buffer.from(password).toString("base64");
  }
}

export { UserService };
```

**Checklist**:

- ✅ All business logic here
- ✅ Call repository for data access
- ✅ Throw AppError with proper status
- ✅ Validate business rules
- ✅ No HTTP concerns

### Phase 4: Create API Layer

#### 4.1 Create Controller (controller.ts)

```typescript
// src/modules/users/user.controller.ts

import { Request, Response } from "express";
import { asyncHandler } from "../core/utils/asyncHandler";
import { ResponseBuilder } from "../core/utils/apiResponse";
import { AppError } from "../core/errors/AppError";
import { HTTP_STATUS } from "../constants/statusCodes";
import { UserService } from "./user.service";
import type { CreateUserRequest, UpdateUserRequest } from "./user.types";

class UserController {
  constructor(private userService: UserService) {}

  createUser = asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const { email, phone, password, name, role } = req.body;

    if (!email || !phone || !password || !name || !role) {
      throw new AppError("Missing required fields", HTTP_STATUS.BAD_REQUEST);
    }

    // Call service
    const user = await this.userService.createUser({
      email,
      phone,
      password,
      name,
      role,
    });

    // Format response
    res
      .status(HTTP_STATUS.CREATED)
      .json(ResponseBuilder.success("User created successfully", user));
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError("User ID required", HTTP_STATUS.BAD_REQUEST);
    }

    const user = await this.userService.getUserById(userId);

    res
      .status(HTTP_STATUS.OK)
      .json(ResponseBuilder.success("User retrieved", user));
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const updates = req.body as UpdateUserRequest;

    const user = await this.userService.updateUser(userId, updates);

    res
      .status(HTTP_STATUS.OK)
      .json(ResponseBuilder.success("User updated", user));
  });
}

export { UserController };
```

**Checklist**:

- ✅ Wrapped with asyncHandler
- ✅ Validate request exists
- ✅ Call service method
- ✅ Format response with ResponseBuilder
- ✅ No business logic
- ✅ Max 40 lines per method

#### 4.2 Create Routes (route.ts)

```typescript
// src/modules/users/user.route.ts

import { Router } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

const router = Router();

// Dependency injection
const userService = new UserService();
const userController = new UserController(userService);

/**
 * Create new user
 * POST /api/v1/users
 */
router.post("/", userController.createUser);

/**
 * Get user by ID
 * GET /api/v1/users/:userId
 */
router.get("/:userId", userController.getUserById);

/**
 * Update user
 * PUT /api/v1/users/:userId
 */
router.put("/:userId", userController.updateUser);

export { router as userRouter };
```

**Checklist**:

- ✅ Document each endpoint
- ✅ Mount at correct paths
- ✅ Connect to controller methods
- ✅ Mount middleware if needed

#### 4.3 Mount Routes (routes/index.ts)

```typescript
// src/routes/index.ts

import { Router } from "express";
import { userRouter } from "../modules/users/user.route";
// import { rideRouter } from "../modules/rides/ride.route";

const router = Router();

router.use("/users", userRouter);
// router.use("/rides", rideRouter);

export { router as apiRouter };
```

**Checklist**:

- ✅ Import module router
- ✅ Mount at correct path
- ✅ Update routes/index.ts

### Phase 5: Testing & Validation

#### 5.1 Manual Testing (Postman/curl)

```bash
# Create user
curl -X POST http://localhost:5000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "SecurePass123!",
    "name": "John Doe",
    "role": "user"
  }'

# Get user
curl -X GET http://localhost:5000/api/v1/users/60d5ec49f1b2c72b8c8d4a1a

# Update user
curl -X PUT http://localhost:5000/api/v1/users/60d5ec49f1b2c72b8c8d4a1a \
  -H "Content-Type: application/json" \
  -d '{ "name": "Jane Doe" }'
```

#### 5.2 Error Testing

```bash
# Missing fields
curl -X POST http://localhost:5000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com" }'
# Expected: 400 { success: false, message: "Missing required fields" }

# Duplicate email
curl -X POST http://localhost:5000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",  # Already exists
    "phone": "+9876543210",
    "password": "SecurePass123!",
    "name": "Another User",
    "role": "driver"
  }'
# Expected: 409 { success: false, message: "Email already registered" }

# Not found
curl -X GET http://localhost:5000/api/v1/users/invalidid
# Expected: 404 { success: false, message: "User not found" }
```

### Phase 6: Architecture Validation

#### 6.1 Verify Layer Separation

- ✅ Repository: Only queries, no business logic
- ✅ Service: All business logic, calls repository
- ✅ Controller: HTTP handling, calls service
- ✅ Route: URL pattern, middleware, controller

#### 6.2 Verify Error Handling

- ✅ All errors are AppError or caught and wrapped
- ✅ Appropriate HTTP status codes
- ✅ Error messages are user-friendly
- ✅ asyncHandler wraps all async handlers

#### 6.3 Verify Response Consistency

- ✅ All responses use ResponseBuilder
- ✅ Success responses have data or message
- ✅ Error responses have success: false
- ✅ DTOs map database models correctly

#### 6.4 Verify Reusability

- ✅ No duplicate code from other modules
- ✅ Uses shared utilities (AppError, ResponseBuilder, etc.)
- ✅ Names follow conventions
- ✅ Could be extended for similar features

### Phase 7: Documentation

#### 7.1 Update API Patterns

If new patterns discovered, update [api-patterns.md](./api-patterns.md)

#### 7.2 Update Module Map

Add to [module-map.md](./module-map.md)

#### 7.3 Add Code Comments

```typescript
/**
 * Creates a new user with validation and verification email
 *
 * @param request - User creation request with email, phone, password, name, role
 * @returns UserResponse with created user details
 * @throws AppError if email/phone already exists (409)
 */
async createUser(request: CreateUserRequest): Promise<UserResponse> {
  // ...
}
```

## Quick Checklist for New Features

```
[ ] Design phase complete (endpoints, data model, dependencies)
[ ] Schema created with proper types and indexes
[ ] Types/DTOs defined for requests and responses
[ ] Repository extends BaseRepository with domain queries
[ ] Service contains all business logic and validation
[ ] Controller validates input and formats responses
[ ] Routes defined with proper HTTP methods
[ ] Routes mounted in routes/index.ts
[ ] Manually tested all happy paths
[ ] Manually tested all error cases
[ ] Verified layer separation (no mixed concerns)
[ ] Verified error handling (AppError throughout)
[ ] Verified response consistency (ResponseBuilder)
[ ] Code follows naming conventions
[ ] JSDoc comments on public methods
[ ] Module documentation updated
[ ] Architecture validated against rules
```

## Common Mistakes to Avoid

### ❌ Business logic in controller

```typescript
// WRONG
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = new User(req.body);
    if (await User.findOne({ email: user.email })) {
      // Business logic here!
      throw new AppError("Email exists", 409);
    }
    await user.save();
    res.json(ResponseBuilder.success("Created", user));
  }),
);

// RIGHT
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body); // Service handles it
    res.json(ResponseBuilder.success("Created", user));
  }),
);
```

### ❌ Direct database queries in service

```typescript
// WRONG
class UserService {
  async createUser(request) {
    const existing = await User.findOne({ email: request.email }); // Direct query!
  }
}

// RIGHT
class UserService {
  async createUser(request) {
    const existing = await this.userRepository.findByEmail(request.email); // Via repo
  }
}
```

### ❌ Not using asyncHandler

```typescript
// WRONG
router.post("/users", async (req, res) => {
  const user = await userService.createUser(req.body); // Unhandled rejection!
  res.json(user);
});

// RIGHT
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body); // Wrapped with asyncHandler
    res.json(ResponseBuilder.success("Created", user));
  }),
);
```

### ❌ Inconsistent response format

```typescript
// WRONG
res.json({ id: user.id, name: user.name }); // No ResponseBuilder
res.json({ success: true, data: user }); // Different format
res.json(user); // Raw data

// RIGHT
res.json(ResponseBuilder.success("User created", user)); // Always use ResponseBuilder
```

### ❌ Not throwing AppError

```typescript
// WRONG
if (!user) {
  return res.status(404).json({ message: "Not found" }); // Manual status handling
}

// RIGHT
if (!user) {
  throw new AppError("User not found", 404); // Let global handler format
}
```
