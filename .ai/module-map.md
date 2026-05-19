# Module Map & Dependencies

## Current Modules

```
SwiftRide Taxi Backend
├── Core Infrastructure (IMPLEMENTED)
│   ├── Error Handling: src/core/errors/AppError.ts
│   ├── Response Builder: src/core/utils/apiResponse.ts
│   └── Async Handler: src/core/utils/asyncHandler.ts
│
├── Configuration (IMPLEMENTED)
│   ├── Environment: src/config/env.ts
│   └── Database: src/config/database.ts
│
├── Constants (IMPLEMENTED)
│   └── HTTP Status Codes: src/constants/statusCodes.ts
│
├── Middleware (IMPLEMENTED)
│   ├── Error Handler: src/middlewares/error.middleware.ts
│   └── 404 Handler: src/middlewares/notFound.middleware.ts
│
├── Data Access (IMPLEMENTED)
│   └── Base Repository: src/repositories/base.repository.ts
│
├── API Layer (SCAFFOLDED)
│   └── Routes: src/routes/index.ts (placeholder)
│
└── FUTURE MODULES (To Be Implemented)
    ├── Users Module
    │   ├── user.schema.ts
    │   ├── user.types.ts
    │   ├── user.repository.ts
    │   ├── user.service.ts
    │   ├── user.controller.ts
    │   └── user.route.ts
    │
    ├── Drivers Module
    │   ├── driver.schema.ts
    │   ├── driver.repository.ts
    │   ├── driver.service.ts
    │   ├── driver.controller.ts
    │   └── driver.route.ts
    │
    ├── Rides Module
    │   ├── ride.schema.ts
    │   ├── ride.types.ts
    │   ├── ride.repository.ts
    │   ├── ride.service.ts
    │   ├── ride.controller.ts
    │   └── ride.route.ts
    │
    ├── Payments Module
    │   ├── payment.schema.ts
    │   ├── payment.repository.ts
    │   ├── payment.service.ts
    │   ├── payment.controller.ts
    │   └── payment.route.ts
    │
    └── Shared Utilities
        ├── validators/
        ├── helpers/
        ├── decorators/
        └── enums/
```

## Dependency Graph

```
┌──────────────────────────────────────────────────────┐
│ Application Layer                                    │
│ - Express Routes                                     │
│ - Controllers                                        │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│ Business Logic Layer                                 │
│ - Services                                           │
│ - Business Rules                                     │
│ - Orchestration                                      │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│ Data Access Layer                                    │
│ - Repositories                                       │
│ - Queries                                            │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│ Database Layer                                       │
│ - MongoDB                                            │
│ - Mongoose ODM                                       │
└──────────────────────────────────────────────────────┘

Horizontal Dependencies (All Layers):
- Core Utilities (AppError, ResponseBuilder, asyncHandler)
- Configuration (env, database)
- Constants (HTTP_STATUS)
- Middleware (errorMiddleware, notFoundMiddleware)
```

## Module Interactions

### User Module (When Implemented)

```
User Route
  ↓
User Controller
  ├─ validateInput()
  ├─ userService.createUser()
  │   ├─ userRepository.findByEmail()
  │   ├─ userRepository.create()
  │   └─ emailService.sendVerification()
  └─ ResponseBuilder.success()
```

### Ride Module (When Implemented)

```
Ride Route
  ↓
Ride Controller
  ├─ validateInput()
  ├─ rideService.createRide()
  │   ├─ userRepository.findById()
  │   ├─ driverRepository.findNearby()
  │   ├─ rideRepository.create()
  │   ├─ paymentService.reserveFunds()
  │   └─ notificationService.notify()
  └─ ResponseBuilder.success()
```

### Payment Module (When Implemented)

```
Payment Route
  ↓
Payment Controller
  ├─ validateInput()
  ├─ paymentService.processPayment()
  │   ├─ userRepository.findById()
  │   ├─ paymentRepository.create()
  │   ├─ rideService.completeRide()
  │   └─ paymentGateway.charge()
  └─ ResponseBuilder.success()
```

## Shared Services (When Implemented)

### Email Service

```
Used by:
- User Service (welcome email, verification)
- Payment Service (receipt email)
- Ride Service (confirmation, completion)
```

### Notification Service

```
Used by:
- Ride Service (ride updates)
- Payment Service (payment status)
- Driver Service (ride requests)
```

### Geocoding Service

```
Used by:
- Ride Service (location validation)
- Driver Service (location updates)
```

## Cross-Module Dependencies

```
Users Module
├─ Used by: Rides, Payments, Drivers
└─ Depends on: Base Repository, AppError, ResponseBuilder

Drivers Module
├─ Used by: Rides (driver matching)
└─ Depends on: Users, Base Repository

Rides Module
├─ Used by: Payments, Ratings, Notifications
├─ Depends on: Users, Drivers, Payments
└─ Depends on: Geocoding Service, Notification Service

Payments Module
├─ Used by: Rides (fare collection)
├─ Depends on: Rides, Users
└─ Depends on: Payment Gateway

Ratings Module
├─ Depends on: Rides, Users, Drivers

Notifications Module
├─ Used by: All modules
└─ Depends on: Email Service, SMS Service, WebSocket
```

## Data Flow Examples

### Creating a Ride

```
1. POST /api/v1/rides
2. Route handler matches → Controller
3. Controller validates request
4. Controller calls RideService.createRide()
5. RideService validates business rules
   ├─ Get user from UserRepository
   ├─ Find available drivers from DriverRepository
   ├─ Check payment balance from PaymentRepository
6. RideService creates ride via RideRepository
7. RideService triggers notifications (EmailService, NotificationService)
8. RideService returns created ride
9. Controller formats response via ResponseBuilder
10. Response sent to client
```

### Processing Payment

```
1. POST /api/v1/payments
2. Route → Controller
3. Controller validates payment details
4. Controller calls PaymentService.processPayment()
5. PaymentService checks user balance
6. PaymentService creates transaction via PaymentRepository
7. PaymentService charges via external Payment Gateway
8. On success:
   ├─ Update ride status via RideService
   ├─ Send receipt via EmailService
   ├─ Notify driver via NotificationService
9. PaymentService returns transaction record
10. Controller formats response
11. Response sent to client
```

## Module Creation Checklist

When implementing a new module (e.g., Users):

```
✅ Step 1: Create Schema
   └─ src/modules/users/user.schema.ts
      - Define TypeScript interface
      - Define Mongoose schema
      - Add indexes
      - Export model

✅ Step 2: Create Types/DTOs
   └─ src/modules/users/user.types.ts
      - CreateUserRequest
      - UpdateUserRequest
      - UserResponse
      - Interfaces for business logic

✅ Step 3: Create Repository
   └─ src/modules/users/user.repository.ts
      - Extend BaseRepository<UserSchema>
      - Add domain-specific queries
      - Handle database errors
      - Throw AppError for errors

✅ Step 4: Create Service
   └─ src/modules/users/user.service.ts
      - Add all business logic
      - Call repository methods
      - Throw AppError for business rule violations
      - Call other services if needed

✅ Step 5: Create Controller
   └─ src/modules/users/user.controller.ts
      - Validate request
      - Call service method
      - Format response with ResponseBuilder
      - Let asyncHandler catch errors

✅ Step 6: Create Routes
   └─ src/modules/users/user.route.ts
      - Define all endpoints
      - Mount middleware
      - Connect controller methods

✅ Step 7: Mount Routes
   └─ Update src/routes/index.ts
      - Import userRouter
      - Mount at correct path

✅ Step 8: Add Validators (if needed)
   └─ src/modules/users/user.validator.ts
      - Validation functions
      - Input sanitization

✅ Step 9: Add Tests (when test setup ready)
   └─ src/modules/users/user.test.ts
      - Unit tests for service
      - Integration tests for routes
```

## Reusability Matrix

```
┌─────────────────────┬──────┬────────┬────────┬────────┬──────────────┐
│ Component           │ Used │ in     │        │        │ Reusable for │
├─────────────────────┼──────┼────────┼────────┼────────┼──────────────┤
│ AppError            │ All  │ modules│ ✓✓✓✓✓  │ HIGH   │ Every error  │
│ ResponseBuilder     │ All  │ modules│ ✓✓✓✓✓  │ HIGH   │ Every route  │
│ asyncHandler        │ All  │ routes │ ✓✓✓✓✓  │ HIGH   │ Every async  │
│ BaseRepository      │ All  │ data   │ ✓✓✓✓✓  │ HIGH   │ Every entity │
│ HTTP_STATUS         │ All  │ modules│ ✓✓✓✓✓  │ HIGH   │ Every error  │
│ Validation utils    │ All  │ modules│ ✓✓✓✓   │ MEDIUM │ Similar data │
│ Formatter helpers   │ Paid │ Ride   │ ✓✓✓✓   │ MEDIUM │ Similar data │
│ EmailService        │ User │ Ride   │ ✓✓✓    │ MEDIUM │ Need emails  │
│ GeoService          │ Ride │ Driver │ ✓✓✓    │ MEDIUM │ Need geo     │
│ UserService         │ Only │ Users  │ ✓      │ LOW    │ User logic   │
│ RideService         │ Only │ Rides  │ ✓      │ LOW    │ Ride logic   │
└─────────────────────┴──────┴────────┴────────┴────────┴──────────────┘

HIGH Reusability: Core utilities used by all modules
MEDIUM Reusability: Shared services used across multiple modules
LOW Reusability: Domain-specific services used by single module
```

## Extension Points

### Adding New Module

1. Create module directory: `src/modules/<name>/`
2. Follow checklist above
3. Mount routes in `src/routes/index.ts`
4. Reuse: AppError, ResponseBuilder, asyncHandler, BaseRepository

### Adding New Shared Service

1. Create in `src/services/<name>.service.ts`
2. Inject into services that need it
3. Wrap external calls with try/catch
4. Throw AppError on failure

### Adding New Validator

1. Create in `src/shared/validators/<name>.validator.ts`
2. Export validation functions
3. Import and use in controllers

### Adding New Utility Helper

1. Create in `src/shared/helpers/<name>.ts`
2. Export utility functions
3. Import and use across services
