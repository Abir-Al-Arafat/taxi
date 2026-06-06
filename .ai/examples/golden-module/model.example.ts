/**
 * Golden Module Model Reference
 * Source of truth: src/modules/auth/user.schema.ts
 *
 * Schema conventions demonstrated here:
 * - explicit document interface
 * - Mongoose schema with timestamps
 * - enum fields for closed sets
 * - unique indexes for identity fields
 * - select:false for secrets
 * - geospatial location with 2dsphere index
 */

/**
 * Real model patterns used by the project:
 * - firstName / lastName are trimmed and required
 * - phoneNumber and email are unique and indexed
 * - location uses GeoJSON Point coordinates
 * - passwordHash is required and hidden by default
 * - verificationTokenHash, passwordResetTokenHash, and refreshTokenHash are hidden by default
 * - passwordResetTokenVerifiedAt tracks verified forgot-password flow state
 * - verifiedAt marks successful signup verification
 */

/**
 * Database best practices demonstrated here:
 * - never store raw OTP values
 * - persist only hashed tokens
 * - keep token expiry fields alongside token hashes
 * - use timestamps for createdAt and updatedAt
 * - index only fields the application queries
 */

export {};
