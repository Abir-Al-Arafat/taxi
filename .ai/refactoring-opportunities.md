# Refactoring Opportunities & Technical Debt

## Current State Analysis

### Strengths ✅

- **Excellent foundation**: Core infrastructure (AppError, ResponseBuilder, asyncHandler) is well-designed
- **Good patterns**: Service-based architecture with repository abstraction
- **Type safety**: TypeScript with strict mode in place
- **Middleware pipeline**: Proper separation of concerns with middleware
- **Environment config**: Centralized configuration management
- **Error handling**: Global error handler with custom AppError class

### Identified Issues 🔴

---

## 1. Dependency Injection Pattern (Priority: MEDIUM)

### Current Issue

```typescript
// src/modules/users/user.route.ts
const userService = new UserService();
const userController = new UserController(userService);
```

**Problem**: Dependencies created in routes, tightly coupled, hard to test

### Refactoring Recommendation

Create a dependency injection container for reusable dependency management.

### Implementation

```typescript
// src/core/container/container.ts
class Container {
  private services: Map<string, () => any> = new Map();
  private instances: Map<string, any> = new Map();

  register(name: string, factory: () => any): void {
    this.services.set(name, factory);
  }

  get<T>(name: string): T {
    if (this.instances.has(name)) {
      return this.instances.get(name) as T;
    }

    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not found in container`);
    }

    const instance = factory();
    this.instances.set(name, instance);
    return instance;
  }
}

export const container = new Container();
```

### Setup in app initialization

```typescript
// src/config/container.ts
import { container } from "../core/container/container";
import { UserRepository } from "../modules/users/user.repository";
import { UserService } from "../modules/users/user.service";
import { UserController } from "../modules/users/user.controller";

export const setupContainer = () => {
  container.register("userRepository", () => new UserRepository(User));
  container.register(
    "userService",
    () => new UserService(container.get("userRepository")),
  );
  container.register(
    "userController",
    () => new UserController(container.get("userService")),
  );
};
```

### Usage in routes

```typescript
// src/modules/users/user.route.ts
const userController = container.get<UserController>("userController");
```

**Benefit**: Easy to mock for tests, centralized dependency setup

---

## 2. Request Validation Layer (Priority: HIGH)

### Current Issue

```typescript
// src/modules/users/user.controller.ts
createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, password, name, role } = req.body;

  if (!email || !phone || !password || !name || !role) {
    throw new AppError("Missing required fields", 400);
  }
  // Repeated validation in every controller
});
```

**Problem**: Validation scattered in controllers, not reusable, clutters controller code

### Refactoring Recommendation

Create centralized validation middleware and validators.

### Implementation

#### 1. Create validators

```typescript
// src/shared/validators/user.validator.ts
import { AppError } from "../core/errors/AppError";
import { HTTP_STATUS } from "../constants/statusCodes";

export const validateCreateUserInput = (data: any): void => {
  if (!data.email || typeof data.email !== "string") {
    throw new AppError("Valid email is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (!data.phone || typeof data.phone !== "string") {
    throw new AppError("Valid phone is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (!data.password || typeof data.password !== "string") {
    throw new AppError("Valid password is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (!data.name || typeof data.name !== "string") {
    throw new AppError("Valid name is required", HTTP_STATUS.BAD_REQUEST);
  }

  if (!["user", "driver"].includes(data.role)) {
    throw new AppError(
      "Role must be 'user' or 'driver'",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
};
```

#### 2. Create validation middleware

```typescript
// src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from "express";

export const createValidationMiddleware = (validator: (data: any) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      validator(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

#### 3. Use in routes

```typescript
// src/modules/users/user.route.ts
import { validateCreateUserInput } from "./user.validator";
import { createValidationMiddleware } from "../middlewares/validation.middleware";

router.post(
  "/",
  createValidationMiddleware(validateCreateUserInput),
  userController.createUser, // Now controller doesn't need validation
);
```

#### 4. Simplified controller

```typescript
createUser = asyncHandler(async (req: Request, res: Response) => {
  // Validation already done by middleware
  const user = await this.userService.createUser(req.body);
  res.status(201).json(ResponseBuilder.success("Created", user));
});
```

**Benefit**: DRY principle, reusable validators, cleaner controllers, easier testing

---

## 3. Missing Logger Service (Priority: MEDIUM)

### Current Issue

```typescript
// Scattered console.log throughout code
console.log("User created");
console.log("MongoDB connected successfully");
console.error("Unexpected error:", err);
```

**Problem**: No structured logging, can't filter/search logs, not production-ready

### Implementation

```typescript
// src/core/utils/logger.ts
import { env } from "../config/env";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export class Logger {
  private static formatMessage(
    level: LogLevel,
    message: string,
    data?: any,
  ): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  static debug(message: string, data?: any): void {
    if (env.nodeEnv === "development") {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  static info(message: string, data?: any): void {
    console.log(this.formatMessage(LogLevel.INFO, message, data));
  }

  static warn(message: string, data?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, data));
  }

  static error(message: string, error?: Error | any): void {
    const errorData =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
    console.error(this.formatMessage(LogLevel.ERROR, message, errorData));
  }
}

export { Logger };
```

### Usage

```typescript
// src/config/database.ts
import { Logger } from "../core/utils/logger";

async connect(): Promise<void> {
  try {
    await mongoose.connect(env.databaseUrl);
    Logger.info("MongoDB connected successfully");
  } catch (error) {
    Logger.error("Failed to connect to MongoDB", error);
    throw error;
  }
}
```

**Benefit**: Structured logging, production-ready, easy to integrate error tracking (Sentry, etc.)

---

## 4. Missing Request/Response Logging (Priority: MEDIUM)

### Current Issue

No visibility into API requests and responses

### Implementation

```typescript
// src/middlewares/logging.middleware.ts
import { Request, Response, NextFunction } from "express";
import { Logger } from "../core/utils/logger";

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();

  // Log incoming request
  Logger.debug("Incoming request", {
    method: req.method,
    path: req.path,
    query: req.query,
  });

  // Intercept response
  const originalJson = res.json;
  res.json = function (data: any) {
    const duration = Date.now() - startTime;
    Logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);

    return originalJson.call(this, data);
  };

  next();
};
```

### Register in app.ts

```typescript
import { loggingMiddleware } from "./middlewares/logging.middleware";

app.use(loggingMiddleware);
```

**Benefit**: Request tracing, performance monitoring, debugging aid

---

## 5. Hardcoded Constants (Priority: LOW)

### Current Issue

```typescript
// src/repositories/base.repository.ts
async create(payload: Partial<TSchema>, session?: ClientSession) {
  const created = await this.model.create([payload as any], ...);
  if (!created[0]) {
    throw new Error("Document creation failed");  // Hardcoded string
  }
}

// src/config/env.ts
this.port = Number(process.env.PORT) || 5000;  // Magic number
```

### Refactoring

```typescript
// src/constants/app.constants.ts
export const DEFAULT_PORT = 5000;
export const DB_OPERATION_TIMEOUT = 5000;
export const MAX_RETRIES = 3;
export const BATCH_SIZE = 100;

// src/constants/messages.ts
export const ERROR_MESSAGES = {
  DOCUMENT_CREATION_FAILED: "Document creation failed",
  USER_NOT_FOUND: "User not found",
  EMAIL_ALREADY_REGISTERED: "Email already registered",
};

// src/constants/validation.ts
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX:
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
};
```

**Benefit**: Single source of truth for values, easier to change globally

---

## 6. Environment Configuration Validation (Priority: HIGH)

### Current Issue

```typescript
// src/config/env.ts
constructor() {
  this.nodeEnv = process.env.NODE_ENV || "development";
  this.port = Number(process.env.PORT) || 5000;

  if (!process.env.DATABASE_URL) {
    throw new AppError("DATABASE_URL is missing", 500);
  }
  this.databaseUrl = process.env.DATABASE_URL;
}
```

**Problem**: Only DATABASE_URL validated, other vars silently fail later

### Refactoring

```typescript
// src/config/env.ts
class Env {
  public readonly nodeEnv: string;
  public readonly port: number;
  public readonly databaseUrl: string;
  public readonly jwtSecret: string;
  public readonly emailService: string;

  constructor() {
    this.validateRequired(["DATABASE_URL", "JWT_SECRET", "EMAIL_SERVICE"]);

    this.nodeEnv = process.env.NODE_ENV || "development";
    this.port = this.parsePort(process.env.PORT);
    this.databaseUrl = process.env.DATABASE_URL!;
    this.jwtSecret = process.env.JWT_SECRET!;
    this.emailService = process.env.EMAIL_SERVICE!;

    this.validateValues();
  }

  private validateRequired(keys: string[]): void {
    const missing = keys.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new AppError(
        `Missing required environment variables: ${missing.join(", ")}`,
        500,
      );
    }
  }

  private parsePort(portStr?: string): number {
    const port = Number(portStr) || 5000;
    if (port < 1 || port > 65535) {
      throw new AppError("PORT must be between 1 and 65535", 500);
    }
    return port;
  }

  private validateValues(): void {
    if (!this.databaseUrl.startsWith("mongodb")) {
      throw new AppError("DATABASE_URL must start with mongodb", 500);
    }
  }
}
```

**Benefit**: Catch config errors early at startup, not runtime

---

## 7. Missing TypeScript Strict Checks (Priority: LOW)

### Current Issue

Some TypeScript strict mode checks not enabled in tsconfig.json

### Recommendation

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Benefit**: Catch type errors at compile time, less runtime bugs

---

## 8. Missing Error Context (Priority: MEDIUM)

### Current Issue

```typescript
// Errors don't include request context for debugging
throw new AppError("User not found", 404);
```

**Problem**: No way to track which request caused the error

### Enhancement

```typescript
// src/core/errors/AppError.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly requestId?: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    context?: Record<string, any>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Usage
throw new AppError("User not found", 404, true, {
  userId: "123",
  operation: "getUserById",
});
```

**Benefit**: Better debugging, error tracking, context preservation

---

## 9. No Request ID Tracking (Priority: MEDIUM)

### Current Issue

Can't correlate logs across multiple API calls

### Implementation

```typescript
// src/middlewares/request-id.middleware.ts
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  req.id = (req.headers["x-request-id"] as string) || uuidv4();
  res.setHeader("x-request-id", req.id);
  next();
};
```

### Register in app.ts (before other middleware)

```typescript
app.use(requestIdMiddleware);
```

**Benefit**: Request tracing, easier debugging, distributed tracing ready

---

## 10. Rate Limiting Not Implemented (Priority: MEDIUM - Future)

### Current Issue

No protection against brute force or DDoS

### Future Implementation

```bash
npm install express-rate-limit
```

```typescript
// src/middlewares/rate-limit.middleware.ts
import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later",
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter for auth endpoints
});
```

---

## Refactoring Priority Order

| Priority  | Task                               | Effort | Impact                                          |
| --------- | ---------------------------------- | ------ | ----------------------------------------------- |
| 🔴 HIGH   | Add request validation middleware  | 2h     | High - Cleaner controllers, reusable validators |
| 🔴 HIGH   | Fix env validation                 | 1h     | High - Catch config errors early                |
| 🟡 MEDIUM | Add dependency injection container | 3h     | Medium - Better testability, reusability        |
| 🟡 MEDIUM | Add logger service                 | 2h     | Medium - Production readiness                   |
| 🟡 MEDIUM | Add request/response logging       | 1h     | Medium - Debugging aid                          |
| 🟡 MEDIUM | Add request ID tracking            | 1h     | Medium - Request tracing                        |
| 🟢 LOW    | Move hardcoded constants           | 1h     | Low - Code cleanliness                          |
| 🟢 LOW    | Enable more TypeScript checks      | 1h     | Low - Type safety                               |

## Implementation Roadmap

```
Phase 1 (This Week):
- [ ] Add validation middleware
- [ ] Fix env validation
- [ ] Add logger service

Phase 2 (Next Week):
- [ ] Add dependency injection
- [ ] Add request/response logging
- [ ] Add request ID tracking

Phase 3 (Planning):
- [ ] Rate limiting
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
```
