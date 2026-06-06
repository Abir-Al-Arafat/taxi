# API Design Patterns & Conventions

## Request/Response Cycle Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Client Request                                              │
│ POST /api/v1/rides { userId, pickupLoc, dropoffLoc }      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │ Route Handler Match     │
        │ (Router find path)      │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────────┐
        │ Controller                  │
        │ 1. Validate input           │
        │ 2. Call service method      │
        │ 3. Format response          │
        └────────────┬────────────────┘
                     │
        ┌────────────▼────────────────┐
        │ Service Layer               │
        │ 1. Business logic           │
        │ 2. Call repository methods  │
        │ 3. Throw AppError on issue  │
        └────────────┬────────────────┘
                     │
        ┌────────────▼────────────────┐
        │ Repository Layer            │
        │ 1. Query MongoDB            │
        │ 2. Return/throw errors      │
        └────────────┬────────────────┘
                     │
        ┌────────────▼────────────────┐
        │ Async Error Handler         │
        │ (Catch promise rejection)   │
        └────────────┬────────────────┘
                     │
        ┌────────────▼────────────────┐
        │ Error Middleware            │
        │ (If error thrown)           │
        │ Format error response       │
        └────────────┬────────────────┘
                     │
┌────────────────────▼──────────────────────────┐
│ Response to Client                            │
│ 200 { success: true, status: 200, data: {...} }│
│ or                                            │
│ 400/404/500 { success: false, status: 404,     │
│ message: "..." }                              │
└─────────────────────────────────────────────────┘
```

## Controller Structure Pattern

### Example: UserController

```typescript
import { Request, Response } from "express";
import { asyncHandler } from "../core/utils/asyncHandler";
import { ResponseBuilder } from "../core/utils/apiResponse";
import { AppError } from "../core/errors/AppError";
import { UserService } from "./user.service";
import { HTTP_STATUS } from "../constants/statusCodes";

class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Create new user
   * POST /api/v1/users
   */
  createUser = asyncHandler(async (req: Request, res: Response) => {
    // 1. Validate input
    const { email, name, phone } = req.body;
    if (!email || !name || !phone) {
      throw new AppError("Missing required fields", HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Call service
    const user = await this.userService.createUser({
      email,
      name,
      phone,
    });

    // 3. Format response
    res
      .status(HTTP_STATUS.CREATED)
      .json(
        ResponseBuilder.success(
          "User created successfully",
          user,
          HTTP_STATUS.CREATED,
        ),
      );
  });

  /**
   * Get user by ID
   * GET /api/v1/users/:userId
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    const user = await this.userService.getUserById(userId);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "User retrieved successfully",
          user,
          HTTP_STATUS.OK,
        ),
      );
  });
}

export { UserController };
```

### Controller Responsibilities

- ✅ Parse request parameters (req.params, req.body, req.query)
- ✅ Validate basic input existence and types
- ✅ Call appropriate service method
- ✅ Format response via ResponseBuilder
- ✅ Set appropriate HTTP status codes
- ❌ Business logic (belongs in service)
- ❌ Database queries (belongs in repository)
- ❌ Complex calculations (belongs in service)

## Service Layer Structure

### Example: UserService

```typescript
import { AppError } from "../core/errors/AppError";
import { HTTP_STATUS } from "../constants/statusCodes";
import { UserRepository } from "./user.repository";
import { EmailService } from "../email/email.service";
import type { User, CreateUserRequest, UpdateUserRequest } from "./user.types";

class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Creates new user with validation and notifications
   */
  async createUser(request: CreateUserRequest): Promise<User> {
    // 1. Validate business rules
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new AppError("Email already registered", HTTP_STATUS.CONFLICT);
    }

    // 2. Perform business operations
    const user = await this.userRepository.create({
      email: request.email,
      name: request.name,
      phone: request.phone,
      isVerified: false,
      createdAt: new Date(),
    });

    // 3. Trigger side effects (async, non-critical)
    await this.emailService.sendVerificationEmail(user.email);

    return user;
  }

  /**
   * Retrieves user by ID with error handling
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return user;
  }

  /**
   * Updates user with validation
   */
  async updateUser(userId: string, updates: UpdateUserRequest): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    // Validate update rules
    if (updates.email && updates.email !== user.email) {
      const emailExists = await this.userRepository.findByEmail(updates.email);
      if (emailExists) {
        throw new AppError("Email already in use", HTTP_STATUS.CONFLICT);
      }
    }

    const updatedUser = await this.userRepository.updateOne(
      { _id: userId },
      updates,
    );

    return updatedUser;
  }

  /**
   * Deletes user (soft delete, sets deletedAt)
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    await this.userRepository.updateOne(
      { _id: userId },
      { deletedAt: new Date() },
    );
  }
}

export { UserService };
```

### Service Responsibilities

- ✅ ALL business logic
- ✅ Validation of business rules
- ✅ Coordination of multiple repositories
- ✅ Throwing AppError with proper status codes
- ✅ Calling other services (e.g., EmailService)
- ❌ HTTP concerns (status codes beyond AppError)
- ❌ Direct database queries
- ❌ Request/response formatting

## Route Structure Pattern

### Example: user.route.ts

```typescript
import { Router } from "express";
import { asyncHandler } from "../core/utils/asyncHandler";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { EmailService } from "../email/email.service";
// Future: import { authMiddleware } from "../middlewares/auth.middleware";
// Future: import { validateUserInput } from "./user.validator";

const router = Router();

// Dependency injection
const userRepository = new UserRepository();
const emailService = new EmailService();
const userService = new UserService(userRepository, emailService);
const userController = new UserController(userService);

/**
 * Create new user
 * POST /api/v1/users
 */
router.post(
  "/",
  // validateUserInput,  // Future: validation middleware
  userController.createUser,
);

/**
 * Get user by ID
 * GET /api/v1/users/:userId
 */
router.get(
  "/:userId",
  // authMiddleware,  // Future: require authentication
  userController.getUserById,
);

/**
 * Update user
 * PUT /api/v1/users/:userId
 */
router.put(
  "/:userId",
  // authMiddleware,
  // validateUserInput,
  userController.updateUser,
);

/**
 * Delete user
 * DELETE /api/v1/users/:userId
 */
router.delete(
  "/:userId",
  // authMiddleware,
  userController.deleteUser,
);

export { router as userRouter };
```

### Route Responsibilities

- ✅ Define HTTP methods and paths
- ✅ Mount appropriate middlewares
- ✅ Connect to controller methods
- ❌ Business logic
- ❌ Controller instantiation (do it here, but pattern to improve later)

### Routes Integration (routes/index.ts)

```typescript
import { Router } from "express";
import { userRouter } from "../modules/users/user.route";
import { rideRouter } from "../modules/rides/ride.route";
import { paymentRouter } from "../modules/payments/payment.route";
import { driverRouter } from "../modules/drivers/driver.route";

const router = Router();

router.use("/users", userRouter);
router.use("/rides", rideRouter);
router.use("/payments", paymentRouter);
router.use("/drivers", driverRouter);

export { router as apiRouter };
```

## Middleware Flow

### Order of Middleware (app.ts)

```typescript
const app = express();

// 1. CORS must be first
app.use(cors());

// 2. Body parsing
app.use(express.json());

// 3. Authentication (if implemented)
// app.use(authMiddleware);

// 4. Logging (if implemented)
// app.use(loggingMiddleware);

// 5. Routes
app.get("/", (req, res) => {
  res.json(
    ResponseBuilder.success("Server running", undefined, HTTP_STATUS.OK),
  );
});
app.use("/api/v1", apiRouter);

// 6. 404 handler (after routes)
app.use(notFoundMiddleware);

// 7. Error handler (must be last)
app.use(errorMiddleware);

export { app };
```

### Middleware Pattern

```typescript
import { Request, Response, NextFunction } from "express";
import { AppError } from "../core/errors/AppError";

/**
 * Example middleware that validates request body
 */
export const validateInput = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new AppError("Request body is required", 400);
  }

  next(); // Pass to next middleware/handler
};

/**
 * Example conditional middleware
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new AppError("Authorization token required", 401);
  }

  // Verify token here
  next();
};
```

## Request Validation Flow

### Validation in Controller

```typescript
class UserController {
  createUser = asyncHandler(async (req: Request, res: Response) => {
    // Extract and validate
    const { email, name, phone } = req.body;

    // Type validation
    if (typeof email !== "string" || !email.trim()) {
      throw new AppError("Email must be non-empty string", 400);
    }
    if (typeof name !== "string" || !name.trim()) {
      throw new AppError("Name must be non-empty string", 400);
    }

    // Format validation
    if (!this.isValidEmail(email)) {
      throw new AppError("Invalid email format", 422);
    }

    // Pass to service
    const user = await this.userService.createUser({
      email: email.trim(),
      name: name.trim(),
      phone,
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json(ResponseBuilder.success("Created", user, HTTP_STATUS.CREATED));
  });

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

### Future: Validation Middleware

```typescript
// validators/user.validator.ts
export const validateCreateUserInput = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { email, name, phone } = req.body;

  if (!email || !name || !phone) {
    throw new AppError("Missing required fields", 400);
  }

  if (typeof email !== "string" || !isValidEmail(email)) {
    throw new AppError("Invalid email format", 422);
  }

  next();
};

// In routes
router.post("/", validateCreateUserInput, userController.createUser);
```

## Response Formatting Standards

### Success Response Structure

```typescript
// Single resource
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890"
  }
}

// Message only (no data)
{
  "success": true,
  "message": "Server is running"
}

// Array of resources (future pagination)
{
  "success": true,
  "message": "Users retrieved",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Error Response Structure

```typescript
// Validation error
{
  "success": false,
  "message": "Email is required"
}

// Not found
{
  "success": false,
  "message": "User not found"
}

// Conflict
{
  "success": false,
  "message": "Email already registered"
}

// Server error
{
  "success": false,
  "message": "Internal server error"
}
```

## Pagination/Filter/Search Structure (Future)

```typescript
// Query format
GET /api/v1/users?page=1&limit=10&sort=createdAt&search=john&role=driver

// Controller
async getRides(req: Request, res: Response) {
  const { page = 1, limit = 10, sort = "-createdAt", search } = req.query;

  const rides = await rideService.searchRides({
    page: Number(page),
    limit: Number(limit),
    sort: String(sort),
    search: String(search),
  });

  res.json(ResponseBuilder.success("Rides retrieved", rides, HTTP_STATUS.OK));
}

// Service
async searchRides(query: SearchQuery): Promise<SearchResult> {
  const skip = (query.page - 1) * query.limit;
  const filter = query.search ? { $text: { $search: query.search } } : {};

  const [items, total] = await Promise.all([
    this.rideRepository.findMany(filter)
      .sort(query.sort)
      .limit(query.limit)
      .skip(skip),
    this.rideRepository.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

// Response
{
  "success": true,
  "message": "Rides retrieved",
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

## Authentication Flow (Future)

```typescript
// Middleware
export const authMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AppError("Authorization token required", 401);
    }

    const decoded = verifyToken(token); // throws if invalid
    req.userId = decoded.id; // Attach to request

    next();
  },
);

// Usage in routes
router.get("/:userId", authMiddleware, userController.getUserById);

// In controller, access authenticated user
getUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const requestingUser = (req as any).userId; // From middleware

  // Verify user can access this resource
  if (userId !== requestingUser) {
    throw new AppError("Unauthorized", 403);
  }

  const user = await this.userService.getUserById(userId);
  res.json(ResponseBuilder.success("User retrieved", user, HTTP_STATUS.OK));
});
```

## Authorization Flow (Future)

```typescript
// Role-based authorization middleware
export const authorize = (allowedRoles: string[]) =>
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).userId;
    const user = await userService.getUserById(userId);

    if (!allowedRoles.includes(user.role)) {
      throw new AppError("Forbidden", 403);
    }

    next();
  });

// Usage
router.post(
  "/",
  authMiddleware,
  authorize(["admin"]),
  userController.createUser,
);
```

## API Versioning

```typescript
// Current: /api/v1/*
app.use("/api/v1", apiRouter);

// Support v2 in future (different routes/responses)
// app.use("/api/v2", apiRouterV2);

// Header-based versioning (alternative)
// Authorization: Bearer <token>
// Api-Version: 2
```

## Common HTTP Status Codes

| Code | Meaning             | When to Use                                         |
| ---- | ------------------- | --------------------------------------------------- |
| 200  | OK                  | Successful GET, PUT, PATCH                          |
| 201  | Created             | Successful POST (resource created)                  |
| 204  | No Content          | Successful DELETE                                   |
| 400  | Bad Request         | Invalid input format, missing fields                |
| 401  | Unauthorized        | Missing/invalid auth token                          |
| 403  | Forbidden           | Authenticated but not authorized                    |
| 404  | Not Found           | Resource doesn't exist                              |
| 409  | Conflict            | Unique constraint violation, business rule conflict |
| 422  | Unprocessable       | Validation failed, semantically invalid             |
| 500  | Server Error        | Internal server error, unexpected condition         |
| 503  | Service Unavailable | Service down, database unavailable                  |
