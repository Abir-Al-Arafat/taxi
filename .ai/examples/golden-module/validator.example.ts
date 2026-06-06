/**
 * Golden Module Validation Reference
 * Source of truth: src/modules/auth/auth.validators.ts
 *
 * Validation structure demonstrated here:
 * - express-validator chains
 * - route-level validation before controllers
 * - custom normalization middleware for nested form-data
 * - a shared error funnel via handleValidationErrors
 */

/**
 * Real helper patterns used by the project:
 *
 * const trimAndRequire = (fieldName: string, message: string) =>
 *   body(fieldName).trim().notEmpty().withMessage(message);
 *
 * const validateOtpFormat = (fieldName: string) =>
 *   body(fieldName).trim().matches(/^\d{4}$/).withMessage("OTP must be a 4 digit code");
 */

/**
 * Reusable validation practices demonstrated by auth.validators.ts:
 * - keep location normalization in middleware
 * - keep business rules in service methods
 * - validate purpose for verifyOtp explicitly
 * - validate password confirmation at the request layer
 */

/**
 * Existing module validations:
 * - signupValidation
 * - loginValidation
 * - forgotPasswordValidation
 * - resendOtpValidation
 * - verifyOtpValidation
 * - resetPasswordValidation
 */

export {};
