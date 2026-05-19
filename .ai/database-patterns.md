# Database Patterns & Conventions

## MongoDB/Mongoose Schema Conventions

### Schema File Structure (\*.schema.ts)

```typescript
import { Schema, model, Document, ObjectId } from "mongoose";

/**
 * User Schema Definition
 * Represents a user account in the system
 */
interface UserSchema extends Document {
  _id: ObjectId;
  email: string;
  name: string;
  phone: string;
  passwordHash: string;
  isVerified: boolean;
  role: "user" | "driver" | "admin";
  profilePicture?: string;
  ratings: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete
}

const userSchema = new Schema<UserSchema>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // Indexed for fast lookups
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Don't return by default
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "driver", "admin"],
      default: "user",
    },
    profilePicture: String,
    ratings: {
      average: {
        type: Number,
        default: 5,
        min: 1,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    deletedAt: Date,
  },
  {
    timestamps: true, // Adds createdAt, updatedAt automatically
  },
);

// Indexes for common queries
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ deletedAt: 1 }); // For soft delete queries

// Virtual: never stored, computed on read
userSchema.virtual("fullName").get(function () {
  return this.name;
});

// Query helper: frequently used filter
userSchema.query.active = function () {
  return this.where({ deletedAt: { $exists: false } });
};

const User = model<UserSchema>("User", userSchema);

export { User, type UserSchema };
```

### Schema Best Practices

#### Required Fields

```typescript
// ✅ CORRECT - Explicit required fields
email: {
  type: String,
  required: true,  // Field is mandatory
}

// ❌ AVOID - Optional by default creates inconsistency
email: String  // Can be missing
```

#### Indexing Strategy

```typescript
// ✅ CORRECT - Index frequently queried fields
schema.index({ userId: 1 }); // Single field
schema.index({ userId: 1, status: 1 }); // Compound index
schema.index({ email: 1 }, { unique: true }); // Unique index
schema.index({ location: "2dsphere" }); // Geospatial index
schema.index({ createdAt: -1 }); // Descending for sort

// ❌ AVOID - Over-indexing (slows writes)
schema.index({ field1: 1 });
schema.index({ field2: 1 });
schema.index({ field3: 1 });
// ... 20 more indexes (bad for write performance)
```

#### Soft Delete Strategy

```typescript
// ✅ CORRECT - Add deletedAt field, never physical delete
schema.add({
  deletedAt: {
    type: Date,
    default: null,
  }
});

// Query helper for active records only
schema.query.active = function() {
  return this.where({ deletedAt: null });
};

// Usage in repository
async findActiveUsers() {
  return this.model.find().active();  // Excludes deleted
}

async softDelete(userId: string) {
  return this.model.findByIdAndUpdate(
    userId,
    { deletedAt: new Date() },
    { new: true },
  );
}
```

#### Timestamps

```typescript
// ✅ CORRECT - Automatic timestamps
new Schema(
  {},
  {
    timestamps: true, // Adds createdAt, updatedAt automatically
  },
);

// ❌ AVOID - Manual timestamp management
new Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

#### Enums

```typescript
// ✅ CORRECT - Enforce valid values
const rideStatusValues = [
  "requested",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
];

schema.add({
  status: {
    type: String,
    enum: rideStatusValues,
    default: "requested",
  },
});

// ❌ AVOID - String without validation
schema.add({
  status: String, // Any value accepted
});
```

## Relationship Patterns

### One-to-Many: Reference Pattern

```typescript
// User has many rides
interface UserSchema extends Document {
  _id: ObjectId;
  email: string;
  name: string;
}

interface RideSchema extends Document {
  _id: ObjectId;
  userId: ObjectId; // Reference to User
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
}

const rideSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  // ... other fields
});

// Query with population
const ride = await Ride.findById(rideId).populate("userId");
// Returns: { _id: ..., userId: { _id: ..., email: ..., name: ... }, ... }
```

### One-to-Many: Embedding (for bounded collections)

```typescript
// When a User has <= 100 ratings (bounded)
interface UserSchema extends Document {
  _id: ObjectId;
  email: string;
  ratings: Array<{
    rideId: ObjectId;
    score: number;
    comment: string;
    createdAt: Date;
  }>;
}

const userSchema = new Schema({
  email: String,
  ratings: [
    {
      rideId: {
        type: Schema.Types.ObjectId,
        ref: "Ride",
      },
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});
```

### Many-to-Many: Reference with Join Table

```typescript
// Driver has many vehicles, Vehicle belongs to Driver
interface DriverSchema extends Document {
  _id: ObjectId;
  name: string;
  vehicleIds: ObjectId[]; // Array of vehicle references
}

interface VehicleSchema extends Document {
  _id: ObjectId;
  driverId: ObjectId;
  licensePlate: string;
}

const driverSchema = new Schema({
  name: String,
  vehicleIds: [
    {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
    },
  ],
});

// Populate both sides if needed
const driver = await Driver.findById(driverId).populate("vehicleIds");
```

## Query Optimization Patterns

### Lean Queries (Read-Only)

```typescript
// ✅ CORRECT - Use .lean() for read-only queries
async findAllUsers(): Promise<UserSchema[]> {
  // Returns plain JSON, ~3x faster
  return this.model.find().lean();
}

// ✅ CORRECT - Use projection to exclude heavy fields
async findUserEmails(): Promise<{ email: string }[]> {
  return this.model.find().select("email").lean();
}

// ❌ AVOID - Full document when only need email
async findUserEmails() {
  return this.model.find();  // Includes all fields
}
```

### Field Selection (Projections)

```typescript
// ✅ CORRECT - Select only needed fields
async getUserProfile(userId: string) {
  return this.model.findById(userId)
    .select("name email profilePicture")  // Only these fields
    .lean();
}

// ✅ CORRECT - Exclude sensitive fields
async listUsers() {
  return this.model.find()
    .select("-passwordHash -loginTokens")  // Exclude these
    .lean();
}

// ❌ AVOID - Return everything
async listUsers() {
  return this.model.find();  // Returns all fields including sensitive data
}
```

### Limiting Results

```typescript
// ✅ CORRECT - Pagination from day 1
async listRides(
  userId: string,
  page: number = 1,
  limit: number = 10,
) {
  const skip = (page - 1) * limit;

  const [rides, total] = await Promise.all([
    this.model.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean(),
    this.model.countDocuments({ userId }),
  ]);

  return {
    items: rides,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ❌ AVOID - Loading all documents
async listRides(userId: string) {
  return this.model.find({ userId });  // Could be millions of docs!
}
```

### Aggregation Pipeline (Complex Queries)

```typescript
// ✅ CORRECT - Complex data transformations
async getUserStats(userId: string) {
  return this.model.aggregate([
    { $match: { userId, deletedAt: null } },
    {
      $group: {
        _id: null,
        totalRides: { $sum: 1 },
        totalDistance: { $sum: "$distance" },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);
}

// ✅ CORRECT - Join data from multiple collections
async getRideWithDetails(rideId: string) {
  return this.model.aggregate([
    { $match: { _id: new ObjectId(rideId) } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "drivers",
        localField: "driverId",
        foreignField: "_id",
        as: "driver",
      },
    },
    { $unwind: "$driver" },
  ]);
}
```

## Transaction & Session Patterns

### ACID Transaction (Multiple Operations)

```typescript
// ✅ CORRECT - All or nothing
async transferCredits(
  fromUserId: string,
  toUserId: string,
  amount: number,
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Deduct from sender
    await this.userRepository.updateOne(
      { _id: fromUserId },
      { $inc: { balance: -amount } },
      session,  // Pass session to all operations
    );

    // Add to receiver
    await this.userRepository.updateOne(
      { _id: toUserId },
      { $inc: { balance: amount } },
      session,
    );

    // Record transaction
    await this.transactionRepository.create(
      {
        fromUserId,
        toUserId,
        amount,
        status: "completed",
      },
      session,
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### Session in Repository

```typescript
// BaseRepository already supports sessions
async create(payload: Partial<TSchema>, session?: ClientSession) {
  const created = await this.model.create(
    [payload as any],
    session ? { session } : undefined,
  );
  return created[0];
}

// Usage
async updateOne(
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
  session?: ClientSession,
) {
  const query = this.model.findOneAndUpdate(filter, update, { new: true });
  if (session) {
    query.session(session);  // Apply session to query
  }
  return query;
}
```

## Population Strategies

### Basic Population

```typescript
// ✅ CORRECT - Populate single reference
const ride = await Ride.findById(rideId).populate("userId"); // Replace userId ObjectId with full user doc

// Result: { _id: ..., userId: { _id: ..., email: ..., name: ... }, ... }
```

### Selective Population

```typescript
// ✅ CORRECT - Only populate needed fields
const ride = await Ride.findById(rideId).populate(
  "userId",
  "name email profilePicture",
); // Only these fields

// Result: { _id: ..., userId: { _id: ..., name: ..., email: ..., profilePicture: ... }, ... }
```

### Multiple Populations

```typescript
// ✅ CORRECT - Populate multiple references
const ride = await Ride.findById(rideId)
  .populate("userId", "name email")
  .populate("driverId", "name phone vehicle");

// Result: { _id: ..., userId: {...}, driverId: {...}, ... }
```

### Nested Population

```typescript
// ✅ CORRECT - Deep population
const ride = await Ride.findById(rideId).populate({
  path: "userId",
  select: "name email",
  populate: {
    path: "referrerId", // Populate user's referrer
    select: "name",
  },
});
```

## Query Patterns (BaseRepository Extensions)

### Future Repository Methods

```typescript
// ✅ Extend BaseRepository with common queries
class UserRepository extends BaseRepository<UserSchema> {
  // Already in base: create, findOne, findMany, updateOne

  async findByEmail(email: string, session?: ClientSession) {
    return this.findOne({ email: email.toLowerCase() }, session);
  }

  async findActive(session?: ClientSession) {
    return this.findMany({ deletedAt: null });
  }

  async countByRole(role: string) {
    return this.model.countDocuments({ role, deletedAt: null });
  }

  async findWithPagination(
    filter: Record<string, unknown> = {},
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  async findAndPopulate(
    filter: Record<string, unknown>,
    populate: string | string[],
  ) {
    return this.model.findOne(filter).populate(populate);
  }

  async updateMany(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ) {
    return this.model.updateMany(filter, update, { new: true });
  }

  async deleteMany(filter: Record<string, unknown>) {
    return this.model.deleteMany(filter);
  }

  async softDelete(filter: Record<string, unknown>) {
    return this.updateMany(filter, { deletedAt: new Date() });
  }
}
```

## Performance Anti-Patterns

### N+1 Queries

```typescript
// ❌ BAD - N+1 query problem
async getUsersWithRides(userIds: string[]) {
  const users = await User.find({ _id: { $in: userIds } });  // 1 query

  for (const user of users) {
    user.rides = await Ride.find({ userId: user._id });  // N queries (one per user)
  }

  return users;
}

// ✅ CORRECT - Single query
async getUsersWithRides(userIds: string[]) {
  return User.find({ _id: { $in: userIds } })
    .populate("rideIds");  // Single query with population
}
```

### Missing Indexes

```typescript
// ❌ BAD - Slow queries without indexes
// Query scans entire collection
const user = await User.findOne({ email: "test@example.com" });

// ✅ CORRECT - Create indexes on queried fields
schema.index({ email: 1 });
// Now query uses index, much faster
```

### Unbounded Arrays

```typescript
// ❌ BAD - Arrays that grow infinitely
interface UserSchema {
  loginHistory: Array<{ timestamp: Date; ip: string }>; // Can grow to GB
}

// ✅ CORRECT - Cap bounded collections or separate
schema.add({
  loginHistory: [{ timestamp: Date, ip: String }],
});

// Limit in query
const recentLogins = await User.findById(userId)
  .lean()
  .select({ loginHistory: { $slice: -10 } }); // Last 10 only
```

## Soft Delete Query Pattern

```typescript
// Queries automatically exclude deleted records
class UserRepository extends BaseRepository<UserSchema> {
  async findActive(filter: Record<string, unknown> = {}) {
    return this.model.find({
      ...filter,
      deletedAt: null,
    });
  }

  async findById(id: string) {
    return this.findOne({
      _id: new ObjectId(id),
      deletedAt: null,
    });
  }

  async findByEmail(email: string) {
    return this.findOne({
      email: email.toLowerCase(),
      deletedAt: null,
    });
  }

  // Include deleted for admin queries
  async findIncludingDeleted(filter: Record<string, unknown> = {}) {
    return this.findMany(filter);
  }
}
```
