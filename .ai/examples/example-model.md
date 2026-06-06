# Example Model and Schema Pattern

Reference standard: `src/modules/auth/user.schema.ts`.

## Current schema pattern

```typescript
export interface AuthUserDocument extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  location: AuthLocationPoint;
  locationAddress?: string;
  gender: AuthGender;
  role: AuthRole;
  passwordHash: string;
  isVerified: boolean;
  verificationTokenHash?: string;
  verificationTokenExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetTokenExpiresAt?: Date;
  passwordResetTokenVerifiedAt?: Date;
  refreshTokenHash?: string;
  refreshTokenExpiresAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## What the schema demonstrates

- Unique and indexed identity fields: `phoneNumber` and `email`.
- GeoJSON location with `2dsphere` indexing.
- Sensitive fields hidden with `select: false`.
- Timestamp tracking with `timestamps: true`.
- Enum restrictions for `gender` and `role`.
- Token and expiry fields for verification, password reset, and refresh flows.

## Real schema conventions in the codebase

- `passwordHash` is required and not selected by default.
- OTP token hashes are stored, not raw OTP values.
- `verifiedAt` is set when signup verification succeeds.
- `passwordResetTokenVerifiedAt` records that a reset code was already verified before password reset.
- `AuthUserModel` is exported as `model<AuthUserDocument>("User", authUserSchema)`.

## Rules to follow for new models

- Keep the schema interface close to the Mongoose document shape.
- Add indexes only for fields that are actually queried.
- Use `select: false` for secrets.
- Use explicit enums for finite-state fields.
- Prefer timestamps over manual created/updated fields.
