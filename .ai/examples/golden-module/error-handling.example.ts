/**
 * Golden Module Error Handling Reference
 * Source of truth: src/core/errors/AppError.ts and src/middlewares/error.middleware.ts
 *
 * Error creation patterns:
 * - throw new AppError(message, HTTP_STATUS.SOMETHING)
 * - use clear operational messages
 * - use status codes from src/constants/statusCodes.ts
 */

/**
 * Error propagation pattern:
 * 1. Service/repository throws AppError.
 * 2. Controller is wrapped in asyncHandler.
 * 3. asyncHandler forwards to next().
 * 4. error.middleware.ts formats the final JSON response.
 */

/**
 * Exception handling standards demonstrated by the project:
 * - AppError is used for expected failures
 * - multer errors are converted to clean 400 responses
 * - unexpected errors fall back to a generic 500 response
 * - error details are not leaked to clients
 */

/**
 * Current auth module examples:
 * - 404 when a user is not found
 * - 409 when an account is already verified
 * - 403 when reset-password is attempted before reset-code verification
 * - 400 when an OTP is invalid or expired
 */

export {};
