# Coding Standards & Conventions

## Naming Conventions

### File Naming

```
✅ CORRECT patterns:
- Route files:        user.route.ts, ride.route.ts
- Controller files:   user.controller.ts, payment.controller.ts
- Service files:      user.service.ts, email.service.ts
- Repository files:   user.repository.ts, transaction.repository.ts
- Schema files:       user.schema.ts, ride.schema.ts
- Middleware files:   auth.middleware.ts, validation.middleware.ts
- Utility files:      validator.ts, formatter.ts, logger.ts
- Type/Interface:     user.types.ts (or inline in .ts files)
- Constants:          constants.ts, statusCodes.ts
- Config files:       env.ts, database.ts

❌ AVOID:
- UserRoute.ts (use user.route.ts)
- user-route.ts (use snake_case for dirs, dots for segments)
- UserRouteHandler.ts (too verbose)
- routes.ts (be specific: which routes?)
```

### Function Naming

```typescript
// ✅ CORRECT - Clear intent, camelCase
getUserById();
createNewTransaction();
validateUserInput();
sendConfirmationEmail();
calculateRideFare();
isUserActive();
hasPermission();
canUserRide();

// ❌ AVOID - Unclear or wrong casing
getUser_By_Id(); // Snake case in function
get_user_by_id(); // Snake case
getUserByIDd(); // Typo
processData(); // Too vague
doStuff(); // Meaningless
temp(); // Temporary naming
x(); // Single letter
```

### Variable Naming

```typescript
// ✅ CORRECT - Descriptive, camelCase
const userId = req.params.id;
const userEmail = user.email;
const isVerified = user.emailVerified;
const rideDistance = calculateDistance();
const maxRetries = 3;
const DEFAULT_PAGE_SIZE = 10;

// ❌ AVOID - Vague or wrong casing
const id = "123"; // Too generic
const u = user; // Single letter
const userData_processed = data; // Mixed casing
const SOME_CONSTANT = 5; // All caps for non-const
const temp = []; // Temporary variable
const result = complexCalculation(); // Too vague, what kind of result?
const d = new Date(); // Single letter
```

### Class Naming (PascalCase)

```typescript
// ✅ CORRECT - PascalCase, clear role
class UserService {
  async createUser() {}
}

class UserRepository {
  async findById() {}
}

class PaymentController {
  async processPayment() {}
}

class ValidationError extends Error {}

class UserNotFoundError extends AppError {}

// ❌ AVOID
class userService {} // lowercase
class User_Service {} // snake_case
class UserServiceHelper {} // Too generic suffix
class U {} // Single letter
```

### Boolean Variable Naming

```typescript
// ✅ CORRECT - Prefix: is, has, can, should
const isActive = true;
const isVerified = user.verified;
const hasPermission = user.role === "admin";
const canRideNow = user.verified && user.balance > 0;
const shouldRetry = attempts < maxAttempts;

// ❌ AVOID
const active = true; // No prefix
const verified = user.verified; // No prefix
const permission = true; // Doesn't indicate boolean
```

### Constant Naming

```typescript
// ✅ CORRECT - UPPER_SNAKE_CASE
const MAX_RIDE_DISTANCE = 50; // km
const DEFAULT_PAYMENT_TIMEOUT = 30000; // ms
const BASE_FARE = 50; // cents
const API_VERSION = "v1";
const DB_CONNECTION_TIMEOUT = 5000;

// ❌ AVOID
const maxRideDistance = 50; // constants are UPPER_SNAKE
const Max_Ride_Distance = 50; // incorrect casing
const max_ride_distance = 50; // lowercase
```

## Type/Interface Conventions

### DTO (Data Transfer Object) Naming

```typescript
// ✅ CORRECT patterns
// Request DTOs - suffix with Request or Dto
interface CreateUserRequest {
  email: string;
  name: string;
  phone: string;
}

interface UpdateRideRequest {
  status: RideStatus;
  endLocation: Coordinates;
}

// Response DTOs - explicit or just type
interface UserResponse {
  id: string;
  email: string;
  name: string;
}

// Or just the entity name with context
interface User {
  id: string;
  email: string;
  name: string;
}

// ❌ AVOID
interface UserDto {} // Just "Dto" is vague
interface CreateUserPayload {} // Too generic "Payload"
interface IUser {} // Don't prefix with I in TypeScript
```

### Schema/Model Type Naming

```typescript
// ✅ CORRECT - Suffix with Schema or Model
interface UserSchema {
  _id: ObjectId;
  email: string;
  name: string;
  createdAt: Date;
}

type RideModel = {
  _id: ObjectId;
  userId: string;
  driverId: string;
};

// ❌ AVOID
interface User {} // Conflicts with DTO name
type UserType {} // Suffix is redundant
```

### Generic Types

```typescript
// ✅ CORRECT - Clear generic names
interface BaseRepository<TSchema> {
  create(payload: Partial<TSchema>): Promise<TSchema>;
  findOne(filter: Record<string, unknown>): Promise<TSchema | null>;
}

interface ApiResponse<TData> {
  success: boolean;
  message: string;
  data?: TData;
}

// ❌ AVOID
interface BaseRepository<T> {} // T is too vague
interface ApiResponse<D> {} // D unclear
interface Response<X> {} // X unclear
```

## Import Ordering Convention

**Every file must follow this import order**:

```typescript
/**
 * 1. External dependencies (node_modules)
 * - Framework imports first
 * - Library imports alphabetically
 */
import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";

/**
 * 2. Type imports (optional - TypeScript 5+)
 * - Separate type-only imports
 */
import type { UserSchema } from "../user/user.schema";
import type { ApiResponse } from "../core/utils/apiResponse";

/**
 * 3. Core/Utils imports
 * - Framework utilities
 * - Error classes
 * - Response builders
 */
import { AppError } from "../core/errors/AppError";
import { ResponseBuilder } from "../core/utils/apiResponse";
import { asyncHandler } from "../core/utils/asyncHandler";

/**
 * 4. Config imports
 * - Environment
 * - Database config
 * - Application config
 */
import { env } from "../config/env";
import { database } from "../config/database";

/**
 * 5. Current module or same-level imports
 * - Services
 * - Repositories
 * - Controllers
 */
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { UserController } from "./user.controller";

/**
 * 6. Relative imports from other modules
 * - Shared utilities
 * - Helpers
 * - Constants
 */
import { validateEmail } from "../shared/validators/email.validator";
import { formatResponse } from "../shared/helpers/formatter";
import { RIDE_STATUSES } from "../constants/ride.statuses";
```

## Formatting Patterns

### Function Declaration

```typescript
// ✅ CORRECT - Clear parameters, proper spacing

// Standard function
function calculateFare(distance: number, baseRate: number): number {
  return distance * baseRate;
}

// Async function
async function getUserById(userId: string): Promise<User> {
  // function body
}

// Function with multiple parameters
async function createRide(
  userId: string,
  pickupLocation: Coordinates,
  dropoffLocation: Coordinates,
  rideType: RideType,
): Promise<Ride> {
  // function body
}

// ❌ AVOID
function calculate_fare(distance: number, base_rate: number):number{ // Spacing, snake_case
function calculateFare(
  distance:number,baseRate:number):number{  // Inconsistent spacing
```

### Class Structure

```typescript
// ✅ CORRECT - Properties, then constructor, then methods
class UserService {
  private userRepository: UserRepository;
  private emailService: EmailService;

  constructor(userRepository: UserRepository, emailService: EmailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async createUser(email: string, name: string): Promise<User> {
    // Validation
    // Business logic
    // Return result
  }

  private async sendWelcomeEmail(user: User): Promise<void> {
    // Private helper methods at bottom
  }
}
```

### Object Destructuring

```typescript
// ✅ CORRECT
const { userId, email, name } = req.body;
const { id: rideId } = req.params;
const { limit = 10, page = 1 } = req.query;

// ❌ AVOID
const userId = req.body.userId;
const email = req.body.email;
const name = req.body.name; // Repetitive, should use destructuring
```

## Async/Await Usage Patterns

### Sequential Operations

```typescript
// ✅ CORRECT - Use await for sequential
async function processPayment(userId: string, amount: number): Promise<void> {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const transaction = await paymentService.charge(user, amount);
  await transactionRepository.save(transaction);
  await emailService.sendReceipt(user.email, transaction);
}

// ❌ AVOID - Don't use promise chains
async function processPayment(userId: string, amount: number): Promise<void> {
  return userRepository
    .findById(userId)
    .then((user) => {
      if (!user) throw new AppError("User not found", 404);
      return paymentService.charge(user, amount);
    })
    .then((transaction) => transactionRepository.save(transaction));
}
```

### Parallel Operations

```typescript
// ✅ CORRECT - Use Promise.all for parallel
async function getUserWithDetails(userId: string): Promise<UserWithDetails> {
  const [user, rides, payments] = await Promise.all([
    userRepository.findById(userId),
    rideRepository.findByUserId(userId),
    paymentRepository.findByUserId(userId),
  ]);

  return { user, rides, payments };
}

// ❌ AVOID - Sequential when parallel possible
async function getUserWithDetails(userId: string): Promise<UserWithDetails> {
  const user = await userRepository.findById(userId);
  const rides = await rideRepository.findByUserId(userId); // Wait unnecessary
  const payments = await paymentRepository.findByUserId(userId); // Wait unnecessary
}
```

### Error Handling in Async

```typescript
// ✅ CORRECT - Try/catch or let asyncHandler catch
async function saveUser(userData: CreateUserRequest): Promise<User> {
  try {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    const user = await userRepository.create(userData);
    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to save user", 500);
  }
}

// In Express controller (asyncHandler handles catch)
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = await userService.saveUser(req.body);
    res.status(201).json(ResponseBuilder.success("User created", user));
  }),
);

// ❌ AVOID - Not handling errors
async function saveUser(userData): Promise<User> {
  const user = await userRepository.create(userData);
  return user; // What if create fails?
}

// ❌ AVOID - Promise.then chains
router.post("/users", (req, res) => {
  userService
    .saveUser(req.body)
    .then((user) => res.json(ResponseBuilder.success("User created", user)))
    .catch((err) => res.json(ResponseBuilder.failure(err.message)));
});
```

## Comments & Documentation

### JSDoc for Public Methods

```typescript
// ✅ CORRECT - Document public methods
/**
 * Creates a new ride request
 * @param userId - ID of the user requesting the ride
 * @param pickupLocation - Coordinates of pickup point
 * @param dropoffLocation - Coordinates of destination
 * @returns Promise<Ride> - Created ride object
 * @throws AppError if user not found or insufficient balance
 */
async function createRide(
  userId: string,
  pickupLocation: Coordinates,
  dropoffLocation: Coordinates,
): Promise<Ride> {
  // Implementation
}

// ❌ AVOID - Over-documenting obvious code
/**
 * Get the user ID
 * @returns The user ID
 */
function getUserId(): string {
  return user.id;
}
```

### Inline Comments (WHY, not WHAT)

```typescript
// ✅ CORRECT - Explain WHY
async function getRidePrice(
  distance: number,
  timeOfDay: string,
): Promise<number> {
  // Apply surge pricing during peak hours (5-8 PM)
  const surgeMultiplier = isPeakHour(timeOfDay) ? 1.5 : 1;

  // Minimum fare ensures driver earns at least $5
  const minimumFare = 500;

  const fare = distance * BASE_RATE * surgeMultiplier;
  return Math.max(fare, minimumFare);
}

// ❌ AVOID - State obvious facts
async function getRidePrice(
  distance: number,
  timeOfDay: string,
): Promise<number> {
  // multiply distance by base rate
  const fare = distance * BASE_RATE;
  // return the fare
  return fare;
}
```

### Complex Logic Comments

```typescript
// ✅ CORRECT - Complex business logic must be documented
async function matchDriver(rideRequest: RideRequest): Promise<Driver> {
  // Find available drivers within 2km radius
  // Sort by acceptance rate (highest first) to ensure reliable pickup
  // Skip drivers with low ratings (<3.5) even if close
  const candidates = await driverRepository
    .findNearby(rideRequest.location, 2000)
    .filter((d) => d.rating >= 3.5)
    .sort((a, b) => b.acceptanceRate - a.acceptanceRate);

  if (candidates.length === 0) {
    throw new AppError("No drivers available", 503);
  }

  return candidates[0];
}
```

## Code Spacing & Indentation

```typescript
// ✅ CORRECT - 2 spaces for indentation, consistent spacing
class RideService {
  async createRide(request: CreateRideRequest): Promise<Ride> {
    // Blank line between logical sections
    const user = await userRepository.findById(request.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Blank line before major operation
    const ride = await rideRepository.create({
      userId: user.id,
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
      createdAt: new Date(),
    });

    return ride;
  }
}

// ❌ AVOID - Inconsistent spacing, no blank lines
class RideService {
  async createRide(request: CreateRideRequest): Promise<Ride> {
    const user = await userRepository.findById(request.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const ride = await rideRepository.create({
      userId: user.id,
      pickupLocation: request.pickupLocation,
    });
    return ride;
  }
}
```

## TypeScript Strict Mode Compliance

```typescript
// ✅ CORRECT - No implicit any
function processUser(userId: string): Promise<User> {
  return userRepository.findById(userId);
}

async function getRides(
  userId: string,
  options?: { limit?: number; skip?: number },
): Promise<Ride[]> {
  const limit = options?.limit ?? 10;
  const skip = options?.skip ?? 0;
  return rideRepository.findByUserId(userId).limit(limit).skip(skip);
}

// ❌ AVOID - Implicit any
function processUser(userId): Promise<any> {
  // No param type, any return
  return userRepository.findById(userId);
}

function getRides(userId, options): Promise<any> {
  // No types
  return rideRepository.findByUserId(userId);
}
```

## Return Statement Conventions

```typescript
// ✅ CORRECT - Clear returns
async function validateUser(userId: string): Promise<boolean> {
  const user = await userRepository.findById(userId);
  return user !== null && user.isVerified;
}

// ✅ CORRECT - Early returns for clarity
function getDiscountPercentage(userType: UserType): number {
  if (userType === "premium") return 20;
  if (userType === "vip") return 30;
  return 0;
}

// ✅ CORRECT - Explicit return for complex operations
async function processRideCompletion(rideId: string): Promise<RideResult> {
  const ride = await rideRepository.findById(rideId);
  if (!ride) throw new AppError("Ride not found", 404);

  ride.status = "completed";
  ride.endedAt = new Date();

  const updatedRide = await rideRepository.updateOne({ _id: rideId }, ride);

  return updatedRide;
}

// ❌ AVOID - Unnecessary ternary or complex returns
function getDiscountPercentage(userType: UserType): number {
  return userType === "premium" ? 20 : userType === "vip" ? 30 : 0;
}
```
