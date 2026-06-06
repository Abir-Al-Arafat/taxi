# Reusable Components & Utilities

## Core Utilities (Already Implemented)

### ResponseBuilder - API Response Standardization

**Location**: `src/core/utils/apiResponse.ts`

```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export class ResponseBuilder {
  static success<T>(message: string, data?: T): ApiResponse<T>;
  static failure(message: string): ApiResponse<undefined>;
}
```

**Usage**:

```typescript
// Success with data
res.json(ResponseBuilder.success("User created", { id: "123", name: "John" }));

// Success without data
res.json(ResponseBuilder.success("Server is running"));

// Error
res.json(ResponseBuilder.failure("User not found"));
```

**Why Centralized**: Ensures ALL responses follow same structure, no inconsistency

---

### AppError - Custom Error Class

**Location**: `src/core/errors/AppError.ts`

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true);
}
```

**Usage**:

```typescript
throw new AppError("User not found", 404);
throw new AppError("Email already registered", 409);
throw new AppError("Unauthorized access", 401);
```

**Why Centralized**: Distinguishes operational (expected) errors from programming errors

---

### asyncHandler - Async Error Wrapper

**Location**: `src/core/utils/asyncHandler.ts`

```typescript
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res, next).catch(next);
  };
```

**Usage**:

```typescript
router.post(
  "/users",
  asyncHandler(async (req: Request, res: Response) => {
    // handler code
  }),
);
```

**Why Centralized**: Catches unhandled promise rejections automatically

---

## Constants (Already Implemented)

### HTTP Status Codes

**Location**: `src/constants/statusCodes.ts`

```typescript
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  // ... 50+ codes
};
```

**Usage**:

```typescript
throw new AppError("Not found", HTTP_STATUS.NOT_FOUND);
res.status(HTTP_STATUS.CREATED).json(...);
```

**Why Centralized**: No magic numbers, type-safe, self-documenting

---

## Middleware (Already Implemented)

### Error Middleware

**Location**: `src/middlewares/error.middleware.ts`

Catches all errors and formats responses globally.

### Not Found Middleware

**Location**: `src/middlewares/notFound.middleware.ts`

Catches unmapped routes (404).

### Upload Middleware

**Location**: `src/middlewares/upload.middleware.ts`

Reusable file upload middleware with configurable validation.

**Supporting Files**:
- Types: `src/shared/types/upload.types.ts`
- Validators: `src/shared/validators/upload.validator.ts`
- Constants: `src/constants/upload.constants.ts`

**Usage**:

```typescript
import { createUploadMiddleware } from "../middlewares/upload.middleware";

// Custom configuration
const uploadAvatar = createUploadMiddleware({
  fieldName: "avatar",
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: ["image/jpeg", "image/png"],
  uploadDir: "uploads/avatars",
  multiple: false,
});

// Pre-configured helpers
import { uploadSingleImage, uploadMultipleImages } from "../middlewares/upload.middleware";

router.post("/avatar", uploadSingleImage("photo"), controller.uploadAvatar);
router.post("/gallery", uploadMultipleImages("images", 10), controller.uploadGallery);
```

**Features**:
- Single and multiple file upload support
- File type validation via MIME types
- File size validation
- Custom upload directories
- Configurable file limits
- Pre-configured helpers for common use cases (images, documents)
- Integration with existing error handling (AppError)

**Documentation**: See `.ai/examples/upload-middleware-usage.md` for comprehensive examples.

---

## Future Reusable Components

### Validators (To Create)

#### Email Validator

```typescript
// src/shared/validators/email.validator.ts
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateEmail = (
  email: string,
): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  if (!isValidEmail(email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true };
};
```

#### Phone Validator

```typescript
// src/shared/validators/phone.validator.ts
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex =
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

export const validatePhone = (
  phone: string,
): { isValid: boolean; error?: string } => {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, error: "Phone is required" };
  }

  if (!isValidPhone(phone)) {
    return { isValid: false, error: "Invalid phone format" };
  }

  return { isValid: true };
};
```

#### Password Validator

```typescript
// src/shared/validators/password.validator.ts
export const isValidPassword = (password: string): boolean => {
  // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validatePassword = (
  password: string,
): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain uppercase letter" };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain lowercase letter" };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: "Password must contain number" };
  }

  return { isValid: true };
};
```

### Helpers (To Create)

#### Formatter Helper

```typescript
// src/shared/helpers/formatter.ts
export const formatPhoneNumber = (phone: string): string => {
  // Convert "+12345678901" to "+1 (234) 567-8901"
  const digits = phone.replace(/\D/g, "");
  const match = digits.match(/^(\d{1,3})(\d{3})(\d{3})(\d{4})$/);

  if (!match) return phone;
  return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
};

export const formatCurrency = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
```

#### Distance Calculator

```typescript
// src/shared/helpers/distance.ts
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const calculateDistance = (
  from: Coordinates,
  to: Coordinates,
): number => {
  // Haversine formula - distance in kilometers
  const R = 6371; // Earth's radius in km
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateEta = (
  distance: number,
  averageSpeed: number = 50, // km/h
): number => {
  // Returns minutes
  return Math.ceil((distance / averageSpeed) * 60);
};
```

#### Price Calculator

```typescript
// src/shared/helpers/price.ts
export interface PriceOptions {
  distance: number;
  timeOfDay: "peak" | "off-peak";
  rideType: "economy" | "comfort" | "premium";
}

const BASE_RATES = {
  economy: 0.5, // Per km
  comfort: 0.7,
  premium: 1.0,
};

const MULTIPLIERS = {
  peak: 1.5, // 5-8 PM
  "off-peak": 1.0,
};

const MINIMUM_FARE = 300; // cents ($3)

export const calculateRidePrice = (options: PriceOptions): number => {
  const baseRate = BASE_RATES[options.rideType];
  const multiplier = MULTIPLIERS[options.timeOfDay];

  let fare = options.distance * baseRate * 100 * multiplier; // Convert to cents

  return Math.max(Math.ceil(fare), MINIMUM_FARE);
};
```

### DTOs/Types (To Create)

#### Pagination

```typescript
// src/shared/types/pagination.ts
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### Ride DTOs

```typescript
// src/modules/rides/ride.types.ts
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CreateRideRequest {
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  rideType: "economy" | "comfort" | "premium";
}

export interface RideResponse {
  _id: string;
  userId: string;
  driverId?: string;
  status: RideStatus;
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  distance: number;
  fare: number;
  createdAt: Date;
}
```

### Query Builders (Future)

```typescript
// src/shared/builders/filter.builder.ts
export class FilterBuilder {
  private filters: Record<string, unknown> = {};

  addEquality(field: string, value: unknown): this {
    if (value !== undefined) {
      this.filters[field] = value;
    }
    return this;
  }

  addRange(field: string, min?: number, max?: number): this {
    const range: Record<string, number> = {};
    if (min !== undefined) range.$gte = min;
    if (max !== undefined) range.$lte = max;
    if (Object.keys(range).length > 0) {
      this.filters[field] = range;
    }
    return this;
  }

  addSearch(field: string, text: string): this {
    if (text) {
      this.filters[field] = { $regex: text, $options: "i" };
    }
    return this;
  }

  addIn(field: string, values: unknown[]): this {
    if (values?.length > 0) {
      this.filters[field] = { $in: values };
    }
    return this;
  }

  build(): Record<string, unknown> {
    return this.filters;
  }
}

// Usage
const filter = new FilterBuilder()
  .addEquality("status", "active")
  .addRange("createdAt", startDate, endDate)
  .addSearch("name", searchText)
  .build();

const rides = await rideRepository.findMany(filter);
```

---

## Dependency Injection Pattern

### Current Simple Pattern

```typescript
// In routes/index.ts
const repository = new UserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

router.post("/", controller.createUser);
```

### Future: Dependency Container

```typescript
// src/shared/container/container.ts
class Container {
  private services: Map<string, any> = new Map();

  register(name: string, factory: () => any): void {
    this.services.set(name, factory());
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) throw new Error(`Service ${name} not found`);
    return service;
  }
}

export const container = new Container();

// Setup
container.register("userRepository", () => new UserRepository());
container.register("emailService", () => new EmailService());
container.register(
  "userService",
  () =>
    new UserService(
      container.get("userRepository"),
      container.get("emailService"),
    ),
);

// Usage
const userService = container.get<UserService>("userService");
```

---

## Shared Enums (To Create)

```typescript
// src/shared/enums/user.enum.ts
export enum UserRole {
  USER = "user",
  DRIVER = "driver",
  ADMIN = "admin",
}

// src/shared/enums/ride.enum.ts
export enum RideStatus {
  REQUESTED = "requested",
  ACCEPTED = "accepted",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// src/shared/enums/payment.enum.ts
export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}
```

---

## Configuration Utilities

### Centralized Config (Existing)

**Location**: `src/config/env.ts`

All environment variables accessed through:

```typescript
import { env } from "../config/env";
env.nodeEnv;
env.port;
env.databaseUrl;
```

### Adding New Config Values

```typescript
class Env {
  // Existing
  public readonly nodeEnv: string;
  public readonly port: number;
  public readonly databaseUrl: string;

  // Future additions
  public readonly jwtSecret: string;
  public readonly emailServiceUrl: string;
  public readonly smsServiceKey: string;
  public readonly awsBucketName: string;

  constructor() {
    // Validate all required vars
    const required = ["DATABASE_URL", "JWT_SECRET", "EMAIL_SERVICE_URL"];

    for (const key of required) {
      if (!process.env[key]) {
        throw new AppError(`${key} is missing`, 500);
      }
    }

    // Initialize
    this.jwtSecret = process.env.JWT_SECRET!;
    // ... etc
  }
}
```

---

## Logger (Future Implementation)

```typescript
// src/core/utils/logger.ts
export class Logger {
  static info(message: string, data?: any): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data);
  }

  static error(message: string, error?: Error): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  }

  static warn(message: string, data?: any): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data);
  }

  static debug(message: string, data?: any): void {
    if (env.nodeEnv === "development") {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, data);
    }
  }
}

// Usage
Logger.info("User created", { userId });
Logger.error("Payment failed", error);
```
