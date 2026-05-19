# Folder Structure & Module Responsibilities

## Project Root Structure

```
taxi/
├── src/                          # All TypeScript source code
├── dist/                         # Compiled JavaScript output (generated)
├── node_modules/                 # Dependencies (gitignored)
├── .ai/                          # AI context system (this folder)
├── .env                          # Environment variables (gitignored)
├── .git/                         # Git repository
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project overview
```

## src/ Directory Structure

```
src/
├── server.ts                     # Entry point - bootstraps application
├── app.ts                        # Express app initialization & middleware setup
├── config/                       # Configuration modules
├── constants/                    # Application constants
├── core/                         # Core utilities & abstractions
├── middlewares/                  # Express middleware functions
├── repositories/                 # Data access layer abstractions
└── routes/                       # API route definitions
```

## Detailed Module Responsibilities

### 📍 **src/server.ts**

**Responsibility**: Application entry point and bootstrap orchestrator

- Imports environment config and database connection
- Initializes Express app
- Handles server startup and port binding
- Logs startup status
- Error handling at bootstrap level

**Used By**: Node.js runtime, `npm run dev/start` commands

**Dependencies**: `env`, `database`, `app`

---

### 📍 **src/app.ts**

**Responsibility**: Express application setup and middleware configuration

- Creates Express app instance
- Configures CORS policy
- Registers JSON body parser middleware
- Defines health check endpoint (GET /)
- Mounts API router at /api/v1
- Registers error handling and 404 middlewares

**Key Pattern**: Middleware stack order matters (CORS → Parser → Routes → Error handlers)

**Dependencies**: `express`, `cors`, `routes`, `error.middleware`, `notFound.middleware`

---

### 📁 **src/config/**

**Responsibility**: Application configuration and external service initialization

#### **database.ts**

- Manages MongoDB connection lifecycle
- Singleton Database class with `connect()` method
- Handles connection errors
- Uses environment `DATABASE_URL`

#### **env.ts**

- Centralizes all environment variable management
- Validates required variables at startup (DATABASE_URL)
- Provides typed access to config values
- Throws AppError if critical vars missing
- Values: `nodeEnv`, `port`, `databaseUrl`

**Pattern**: Singleton pattern for both config modules

---

### 📁 **src/constants/**

**Responsibility**: Centralized constants for the entire application

#### **statusCodes.ts**

- HTTP status code constants for consistent response codes
- Organized by status category (1xx, 2xx, 3xx, 4xx, 5xx)
- Prevents magic numbers in code
- Use: `HTTP_STATUS.OK`, `HTTP_STATUS.NOT_FOUND`, etc.

**Future**: Add business domain constants (ride statuses, payment states, etc.)

---

### 📁 **src/core/**

**Responsibility**: Core abstractions, utilities, and error handling

#### **errors/AppError.ts**

- Custom error class extending Error
- Properties: `statusCode`, `isOperational`, `name`
- Distinguishes operational errors from programming errors
- Used throughout app for consistency

**Pattern**: Always throw AppError with appropriate status code

#### **utils/apiResponse.ts**

- ResponseBuilder class for consistent API responses
- Methods: `success()` (returns data if provided), `failure()` (error response)
- Interface: `ApiResponse<T>` defines response shape
- Pattern: Always use ResponseBuilder, never send raw data

**Response Format**:

```json
{
  "success": true|false,
  "message": "string",
  "data": "T (optional)"
}
```

#### **utils/asyncHandler.ts**

- HOF wrapper for async Express route handlers
- Catches promise rejections and passes to error middleware
- Prevents "unhandled promise rejection" crashes
- Pattern: Wrap all async controller methods with asyncHandler

---

### 📁 **src/middlewares/**

**Responsibility**: Express middleware for request/response processing

#### **error.middleware.ts**

- Global error handler (must be last middleware)
- Checks if error is AppError
- Returns formatted error response via ResponseBuilder
- Falls back to "Internal server error" for non-operational errors

#### **notFound.middleware.ts**

- Catches unmapped routes
- Returns 404 with formatted response
- Must be registered after all route handlers

**Future Middlewares**:

- `auth.middleware.ts` - JWT authentication
- `validation.middleware.ts` - Request payload validation
- `logging.middleware.ts` - Request/response logging
- `rate-limit.middleware.ts` - Rate limiting
- `cors-policy.middleware.ts` - Advanced CORS rules

---

### 📁 **src/repositories/**

**Responsibility**: Data access abstraction layer (Repository Pattern)

#### **base.repository.ts**

- Abstract generic repository for all models
- Generic type `TSchema` for type safety
- Methods: `create()`, `findOne()`, `findMany()`, `updateOne()`
- Supports MongoDB sessions for transactions
- Pattern: Extend BaseRepository for each domain entity

**Transaction Support**:

- Optional `session?: ClientSession` parameter
- Enables ACID transactions across multiple queries

**Future**:

- `deleteOne()`, `deleteMany()` with soft-delete support
- `findWithPagination()` for list endpoints
- `bulkWrite()` for batch operations
- Repository pattern for each module (UserRepository, RideRepository, etc.)

---

### 📁 **src/routes/**

**Responsibility**: API route definitions and mounting

#### **index.ts**

- Central route aggregator
- Currently commented out: `accountRouter`, `transactionRouter`
- Pattern: Import module routers and mount at specific paths
- Enables modular route organization

**Expected Structure**:

```typescript
router.use("/accounts", accountRouter);
router.use("/drivers", driverRouter);
router.use("/rides", ridesRouter);
router.use("/users", userRouter);
```

---

## Module Dependencies Map

```
server.ts
├── env (config)
├── database (config)
└── app
    ├── express
    ├── cors
    ├── routes (currently empty)
    ├── error.middleware
    │   ├── AppError (core/errors)
    │   └── ResponseBuilder (core/utils)
    ├── notFound.middleware
    │   └── ResponseBuilder (core/utils)
    └── ResponseBuilder (core/utils)

config/env
└── AppError (core/errors)

config/database
└── mongoose

core/utils/asyncHandler
└── express types

core/utils/apiResponse
└── (no dependencies)

core/errors/AppError
└── (no dependencies)

repositories/base.repository
└── mongoose (Model, ClientSession)
```

## Future Module Structure (Expected)

```
src/
├── modules/
│   ├── users/
│   │   ├── user.route.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   └── user.schema.ts
│   ├── drivers/
│   │   ├── driver.route.ts
│   │   ├── driver.controller.ts
│   │   ├── driver.service.ts
│   │   ├── driver.repository.ts
│   │   └── driver.schema.ts
│   ├── rides/
│   │   └── ...
│   └── payments/
│       └── ...
├── shared/
│   ├── validators/
│   ├── decorators/
│   └── helpers/
└── ...existing structure...
```

## Architectural Boundaries

### 1. **Routes ↔ Controllers** Boundary

- Routes: Define URL patterns only
- Controllers: Receive req, delegate to service, format response
- Rule: Controllers should NOT contain business logic

### 2. **Controllers ↔ Services** Boundary

- Controllers: Handle HTTP concerns (request/response)
- Services: Contain ALL business logic
- Rule: Services should NOT know about Express (no req/res)

### 3. **Services ↔ Repositories** Boundary

- Services: Orchestrate business workflows
- Repositories: Abstract data access (CRUD only)
- Rule: Only repositories touch MongoDB directly

### 4. **Configuration Access**

- Only `env` module should read process.env
- All other modules access config via `env` singleton

### 5. **Error Handling**

- Only repositories and services throw AppError
- Controllers catch AppError (via asyncHandler)
- asyncHandler passes to global errorMiddleware
