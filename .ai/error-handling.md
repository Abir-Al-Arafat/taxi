# Error Handling Strategy

## Global Error Handling Architecture

```
┌─────────────────────────────────┐
│ Express Route Handler           │
│ (Async function)                │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│ asyncHandler Wrapper            │
│ (Catches promise rejections)    │
└────────────┬────────────────────┘
             │
             ├─► Error thrown
             │
┌────────────▼────────────────────┐
│ Error Middleware                │
│ (Global error handler)          │
│ - Checks instanceof AppError    │
│ - Formats response              │
│ - Returns error to client       │
└─────────────────────────────────┘
```

## AppError Custom Error Class

### Structure

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Properties

- **message**: Human-readable error description
- **statusCode**: HTTP status code (400, 401, 404, 500, etc.)
- **isOperational**: `true` = expected error (user input error), `false` = programming error

## Throwing AppError (Mandatory Pattern)

### Usage in Services

```typescript
class UserService {
  async getUserById(userId: string): Promise<User> {
    // Validate input
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    // Query
    const user = await this.userRepository.findById(userId);

    // Check result
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async updateUser(userId: string, updates: UpdateUserRequest): Promise<User> {
    // Business rule violation
    if (updates.email && updates.email === user.email) {
      throw new AppError("New email must be different", 422);
    }

    // Unique constraint
    const existingUser = await this.userRepository.findByEmail(updates.email);
    if (existingUser) {
      throw new AppError("Email already in use", 409);
    }

    return await this.userRepository.updateOne({ _id: userId }, updates);
  }

  async createRide(userId: string, request: CreateRideRequest): Promise<Ride> {
    // Business logic validation
    if (request.pickupLocation === request.dropoffLocation) {
      throw new AppError("Pickup and dropoff must be different", 422);
    }

    // Check preconditions
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isVerified) {
      throw new AppError("User must be verified to request rides", 422);
    }

    if (user.balance < MINIMUM_BALANCE) {
      throw new AppError("Insufficient balance", 422);
    }

    return await this.rideRepository.create({
      userId,
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
      status: "requested",
    });
  }
}
```

## HTTP Status Code Standards

### 4xx Client Errors (User's responsibility to fix)

#### 400 - Bad Request

Invalid input format or missing required fields

```typescript
throw new AppError("Email is required", 400);
throw new AppError("Invalid email format", 400);
throw new AppError("Distance must be a number", 400);
```

#### 401 - Unauthorized

Missing or invalid authentication

```typescript
throw new AppError("Authorization token required", 401);
throw new AppError("Invalid or expired token", 401);
throw new AppError("Please log in to continue", 401);
```

#### 403 - Forbidden

Authenticated but not authorized for this resource

```typescript
throw new AppError("Only admin can delete users", 403);
throw new AppError("Cannot access other user's data", 403);
throw new AppError("Driver account cannot book rides", 403);
```

#### 404 - Not Found

Resource doesn't exist

```typescript
throw new AppError("User not found", 404);
throw new AppError("Ride not found", 404);
throw new AppError("Route not found", 404);
```

#### 409 - Conflict

Business rule violation, usually uniqueness

```typescript
throw new AppError("Email already registered", 409);
throw new AppError("Phone number already in use", 409);
throw new AppError("Cannot cancel completed ride", 409);
```

#### 422 - Unprocessable Entity

Request format is valid but semantically invalid

```typescript
throw new AppError("User must be verified to book", 422);
throw new AppError("Cannot ride in same city only", 422);
throw new AppError("Minimum fare requirement not met", 422);
```

### 5xx Server Errors (Server's responsibility to fix)

#### 500 - Internal Server Error

Unexpected server error

```typescript
throw new AppError("Failed to process payment", 500);
throw new AppError("Database connection error", 500);
```

#### 503 - Service Unavailable

Service temporarily down

```typescript
throw new AppError("Payment service is unavailable", 503);
throw new AppError("SMS service temporarily down", 503);
```

## Error Handling by Layer

### Repository Layer

```typescript
class UserRepository extends BaseRepository<UserSchema> {
  async create(payload: Partial<UserSchema>, session?: ClientSession) {
    try {
      const created = await this.model.create(
        [payload as any],
        session ? { session } : undefined,
      );
      if (!created[0]) {
        throw new AppError("Failed to create user", 500);
      }
      return created[0];
    } catch (error) {
      // Mongoose validation error
      if (error instanceof mongoose.ValidationError) {
        const messages = Object.values(error.errors)
          .map((e) => e.message)
          .join(", ");
        throw new AppError(messages, 422);
      }

      // Unique constraint error (duplicate key)
      if (error instanceof mongoose.MongoServerError && error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new AppError(`${field} already exists`, 409);
      }

      throw error;
    }
  }
}
```

### Service Layer

```typescript
class UserService {
  async createUser(request: CreateUserRequest): Promise<User> {
    try {
      // Validate business rules
      const existingUser = await this.userRepository.findByEmail(request.email);
      if (existingUser) {
        throw new AppError("Email already registered", 409);
      }

      // Create via repository (throws if DB error)
      const user = await this.userRepository.create(request);

      // Side effect (non-critical failure)
      try {
        await this.emailService.sendWelcomeEmail(user.email);
      } catch (emailError) {
        // Log but don't throw - user was created successfully
        console.error("Failed to send welcome email:", emailError);
      }

      return user;
    } catch (error) {
      // Re-throw AppError as-is
      if (error instanceof AppError) throw error;

      // Wrap unexpected errors
      throw new AppError("Failed to create user", 500);
    }
  }
}
```

### Controller Layer

```typescript
class UserController {
  createUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate request format
      const { email, name, phone } = req.body;
      if (!email || !name || !phone) {
        throw new AppError("Missing required fields", 400);
      }

      // Call service (may throw AppError)
      const user = await this.userService.createUser({
        email,
        name,
        phone,
      });

      // Format response
      res
        .status(201)
        .json(ResponseBuilder.success("User created successfully", user));
    } catch (error) {
      // asyncHandler catches and passes to errorMiddleware
      throw error;
    }
  });
}
```

### Global Error Middleware

```typescript
export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Operational error (expected)
  if (err instanceof AppError) {
    res.status(err.statusCode).json(ResponseBuilder.failure(err.message));
    return;
  }

  // Programming error (unexpected)
  console.error("Unexpected error:", err);
  res.status(500).json(ResponseBuilder.failure("Internal server error"));
};
```

## Async Error Wrapper (asyncHandler)

```typescript
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    // Catches unhandled promise rejections
    void fn(req, res, next).catch(next);
  };
```

### Usage Pattern

```typescript
// ✅ CORRECT - Always wrap async handlers
router.post(
  "/users",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(ResponseBuilder.success("Created", user));
  }),
);

// ✅ CORRECT - Can still use try/catch for explicit handling
router.post(
  "/users",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json(ResponseBuilder.success("Created", user));
    } catch (error) {
      // Handle specific error types
      if (error instanceof ValidationError) {
        // Custom handling
      }
      throw error; // Re-throw to errorMiddleware
    }
  }),
);

// ❌ AVOID - Not wrapping async handlers
router.post("/users", async (req: Request, res: Response) => {
  // Unhandled promise rejection crashes server
  const user = await userService.createUser(req.body);
});
```

## Mongoose/Database Error Handling

### Validation Errors

```typescript
// Mongoose validation error on save
try {
  await User.create({
    email: "invalid-email", // Email validation fails
  });
} catch (error) {
  if (error instanceof mongoose.ValidationError) {
    const messages = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
    throw new AppError(messages, 422);
  }
}
```

### Unique Constraint Errors

```typescript
// Duplicate key error (unique index violation)
try {
  await User.create({
    email: "existing@email.com", // Already exists
  });
} catch (error) {
  if (error instanceof mongoose.MongoServerError && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    throw new AppError(`${field} already exists`, 409);
  }
}
```

### Connection Errors

```typescript
// Database connection failed
try {
  await User.findById(userId);
} catch (error) {
  if (error instanceof mongoose.MongooseError) {
    throw new AppError("Database connection error", 503);
  }
}
```

## Error Response Format

### Success Response (2xx)

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "message": "Email is required"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "User not found"
}
```

#### 409 Conflict

```json
{
  "success": false,
  "message": "Email already registered"
}
```

#### 500 Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Error Message Guidelines

### ✅ GOOD - User-friendly, actionable

```
"Email already registered. Use 'Forgot Password' to recover your account."
"Insufficient balance. Please add funds to continue booking."
"Your account is not verified. Check your email for verification link."
```

### ❌ BAD - Technical, not helpful

```
"MongooseValidationError: email field validation failed"
"ECONNREFUSED 127.0.0.1:27017"
"TypeError: Cannot read property 'userId' of undefined"
```

## Future Error Enhancements

### Custom Error Classes

```typescript
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

// Usage
throw new ValidationError("Email format invalid");
throw new ResourceNotFoundError("User");
throw new UnauthorizedError("Token expired");
```

### Error Tracking

```typescript
// Future: Add Sentry or similar error tracking
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (!(err instanceof AppError)) {
    // Send to error tracking service
    // await Sentry.captureException(err);
    console.error("Unhandled error:", err);
  }

  // Send response
  if (err instanceof AppError) {
    res.status(err.statusCode).json(ResponseBuilder.failure(err.message));
  } else {
    res.status(500).json(ResponseBuilder.failure("Internal server error"));
  }
};
```
