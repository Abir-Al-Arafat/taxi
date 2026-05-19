# Backend Engineering Rules & Principles

## Architectural Rules

### 🏗️ **Service-Based Architecture (Mandatory)**

- **Rule**: Business logic lives ONLY in Service layer
- **Controllers**: HTTP handling only (400 lines max)
- **Repositories**: Data access abstraction only
- **Violation**: Service calling another repository directly (should go through service)
- **Enforced By**: Code review, architecture checking

### 🎯 **Thin Controllers Pattern**

- **Rule**: Controllers max 40 lines of code
- **Controller Responsibility**:
  - Validate request exists (shape, required fields)
  - Call appropriate service method
  - Format response via ResponseBuilder
  - Pass errors to errorMiddleware
- **Anti-Pattern**: Business logic in controllers
- **Anti-Pattern**: Direct database queries in controllers

### 📦 **Repository Pattern (Data Access)**

- **Rule**: ALL database access goes through repositories
- **Implementation**: Extend `BaseRepository<TSchema>`
- **Anti-Pattern**: Using `Model.find()` directly in services
- **Benefit**: Easy to mock for testing, centralized query logic

### 🔄 **Reusable Utilities Over Duplicated Code (DRY)**

- **Rule**: Any logic used twice+ should be a utility
- **Pattern**: Create shared utils in `src/core/utils/` or `src/shared/`
- **Anti-Pattern**: Copy-paste code across modules
- **Review**: Look for duplicate patterns before every merge

## Code Quality Rules

### ✨ **KISS Principle (Keep It Simple Stupid)**

- **Rule**: Code must be understandable in one read
- **Measure**: Complex logic > 5 levels of nesting = too complex
- **Action**: Break into smaller functions
- **Naming**: Variable/function names must be self-explanatory (no `x`, `data`, `temp`)

### 🧹 **DRY Principle (Don't Repeat Yourself)**

- **Rule**: No duplicate code patterns across codebase
- **Check**: `grep` for repeated 4+ line blocks before commit
- **Action**: Extract to utility or base class
- **Exception**: Template boilerplate is OK for module scaffolding

### 🔐 **SOLID Principles**

#### **S - Single Responsibility**

- One class = One reason to change
- Service: One domain entity or concern
- Utility: One specific task

#### **O - Open/Closed**

- Code open for extension, closed for modification
- Pattern: Use inheritance (BaseRepository, BaseService)
- Use: Extend base classes instead of modifying them

#### **L - Liskov Substitution**

- Subclasses must be substitutable for base classes
- All repositories inherit BaseRepository consistently
- Consistent method signatures across implementations

#### **I - Interface Segregation**

- Many client-specific interfaces > one general interface
- Don't force services to implement unused methods
- Use partial types where appropriate

#### **D - Dependency Inversion**

- Depend on abstractions, not concretions
- Pattern: Inject repositories as constructor params
- Use: Service(repository) not Service() { this.repo = new Repo() }

## Error Handling Rules

### ❌ **AppError Usage (Mandatory)**

- **Rule**: All operational errors throw AppError
- **Format**: `throw new AppError(message, statusCode)`
- **statusCode**: Use HTTP_STATUS constants
- **Non-operational**: Programming errors (null access, type errors) crash appropriately

### 🎯 **Error Status Codes**

```
400 - Bad Request (validation failed, bad input format)
401 - Unauthorized (not authenticated)
403 - Forbidden (authenticated but not authorized)
404 - Not Found (resource doesn't exist)
409 - Conflict (unique constraint, business rule violation)
422 - Unprocessable Entity (validation failed, semantically invalid)
500 - Server Error (internal error, unexpected condition)
```

### 📝 **Error Messages**

- Clear, user-friendly descriptions
- No technical stack traces in production
- No database-specific error details exposed

## Async/Await Rules

### ⏳ **Always Use asyncHandler Wrapper**

- **Rule**: Every Express route handler wrapped with asyncHandler
- **Pattern**:

```typescript
router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    // handler code
  }),
);
```

- **Why**: Catches unhandled promise rejections

### ⚡ **Async/Await Standards**

- Use `async/await` over `.then()` chains
- Avoid `void promises` (handled by asyncHandler)
- Use `await` for sequential operations
- Use `Promise.all()` for parallel operations

## Validation Rules

### ✔️ **Request Validation (Mandatory)**

- **Layer**: Validate in controller before calling service
- **Pattern**: Create validators per module
- **Tools**: Use TypeScript interfaces + custom validators (or add validation library)
- **Response**: Return 400 or 422 with detailed error field messages

### 🔍 **Validation Standards**

- **Required Fields**: Explicit check
- **Type Checking**: Validate type matches schema
- **Range Validation**: Min/max for numbers, strings
- **Format Validation**: Email, phone, dates, etc.
- **Uniqueness**: Check at service level before save
- **Custom Rules**: Business logic validation (e.g., pickup ≠ dropoff in rides)

## Response Structure Rules

### 📋 **Consistent Response Format (Mandatory)**

All responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T; // Only on success
}
```

### ✅ **Success Response Examples**

```json
// Single resource
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": "123", "name": "John" }
}

// Message-only
{
  "success": true,
  "message": "Server is running"
}

// List with pagination (future)
{
  "success": true,
  "message": "Users retrieved",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### ❌ **Error Response Examples**

```json
{
  "success": false,
  "message": "User not found"
}

{
  "success": false,
  "message": "Email already registered"
}
```

## Database Query Rules

### 🗄️ **Query Optimization Standards**

- Always specify fields to return (no `select()` = all fields)
- Use `.lean()` for read-only queries (JSON only, no methods)
- Limit results for list queries (implement pagination)
- Use indexes for frequently queried fields

### 🔗 **Population/Reference Standards**

- Only populate when needed (not default)
- Specify which fields to populate: `.populate('userId', 'name email')`
- Validate populated references exist before using
- Future: Use aggregation pipeline for complex joins

### 💾 **Transaction Standards**

- Use sessions for multi-document operations
- Start session in service, pass to repositories
- All-or-nothing: Either all succeed or all rollback
- Pattern:

```typescript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // All repo calls pass session
  await rollbackSession();
  await commitSession();
} catch {
  await abortTransaction();
}
```

### ❌ **Performance Anti-Patterns**

- No N+1 queries (query in loop)
- No loading all documents unless needed
- No multiple queries when aggregation works
- No missing indexes on frequently queried fields

## Security Rules

### 🔐 **Mandatory Security Standards**

- **No credentials in code**: All use environment variables
- **No sensitive data in logs**: Filter passwords, tokens, PII
- **Input validation**: Sanitize all user input before DB
- **SQL/No-injection**: Use parameterized queries (Mongoose does this)
- **Environment separation**: Different ENV vars for dev/staging/prod
- **Error info**: Don't expose database/system details in error messages

### 🔑 **Future Auth Rules**

- Implement JWT middleware for protected routes
- Hash passwords with bcrypt before storing
- Implement rate limiting on auth endpoints
- Add CORS whitelisting for allowed origins
- Implement request signing or HMAC verification

## Naming Conventions

### 📌 **File Naming**

- Routes: `*.route.ts` (e.g., `user.route.ts`)
- Controllers: `*.controller.ts` (e.g., `user.controller.ts`)
- Services: `*.service.ts` (e.g., `user.service.ts`)
- Repositories: `*.repository.ts` (e.g., `user.repository.ts`)
- Schemas: `*.schema.ts` (e.g., `user.schema.ts`)
- Middleware: `*.middleware.ts` (e.g., `auth.middleware.ts`)
- Utilities: `*.ts` without suffix (e.g., `validator.ts`)

### 📝 **Variable/Function Naming**

- camelCase for variables and functions
- PascalCase for classes and types
- UPPER_SNAKE_CASE for constants
- Private properties: `_privateValue`
- Boolean variables: prefix with `is`, `has`, `can` (e.g., `isActive`, `hasPermission`)

### 🏗️ **Class Naming**

- Service classes: `UserService`, `RideService`
- Repository classes: `UserRepository`, `RideRepository`
- Error classes: `AppError`, `ValidationError` (suffix with Error)
- Middleware functions: descriptive names (e.g., `authMiddleware`, `validateInput`)

## Code Standards

### 📐 **Function Length**

- Service methods: Max 30 lines
- Complex logic: Extract to private methods
- Controllers: Max 40 lines
- Utilities: Max 20 lines

### 🧩 **Method Parameters**

- Max 3 parameters, else use object parameter
- Always name parameters clearly
- Use destructuring for object parameters

### 💬 **Comments & Documentation**

- **Method-level**: JSDoc for public methods
- **Inline comments**: For WHY, not WHAT
- **Avoid**: Over-commenting obvious code
- **Required**: Complex business logic must be commented

### 🔄 **Import Ordering**

```typescript
// 1. External dependencies
import express from "express";
import mongoose from "mongoose";

// 2. Types/interfaces
import type { UserSchema } from "./user.schema";

// 3. Internal imports - core
import { AppError } from "../core/errors/AppError";
import { ResponseBuilder } from "../core/utils/apiResponse";

// 4. Internal imports - config
import { env } from "../config/env";

// 5. Internal imports - modules/same level
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
```

## Clean Code Standards

### 🚫 **Forbidden Patterns**

- No `var` keyword (use `const`/`let`)
- No `any` type (use proper types or generics)
- No console.log in production (use proper logger)
- No empty catch blocks
- No unreachable code
- No magic numbers (use constants)

### ✅ **Required Patterns**

- Use `const` by default, `let` only if reassigning
- Explicit error handling (try/catch or next())
- Type everything (no implicit `any`)
- Meaningful variable names
- Single responsibility per function
- Early returns to reduce nesting

## Scalability Rules

### 📈 **Future-Proofing Standards**

- Design with multi-instance servers in mind
- Use stateless service architecture
- Keep session/cache externally (Redis) not in memory
- Use message queues for async tasks
- Design database schema for indexing growth
- Avoid endpoint-specific code (make patterns reusable)

### ⚙️ **Performance Standards**

- Cache frequently accessed data (implement later)
- Implement pagination from day 1
- Use batch operations for bulk updates
- Monitor slow queries
- Use appropriate HTTP status codes for optimization
