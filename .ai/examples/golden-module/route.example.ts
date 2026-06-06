/**
 * Golden Module Route Reference
 * Source of truth: src/modules/auth/auth.route.ts
 *
 * Route organization demonstrated here:
 * - multer().none() for form-data endpoints
 * - normalization middleware before validation when needed
 * - validation chains before controller handlers
 * - authenticate middleware on protected routes
 */

import { Router } from "express";

export const goldenModuleRouter = Router();

/**
 * Middleware ordering demonstrated by auth routes:
 * 1. upload.none() for multipart bodies
 * 2. normalization middleware for shaped payloads
 * 3. request validation chains
 * 4. handleValidationErrors
 * 5. controller method
 */

/**
 * Authorization flow demonstrated by auth routes:
 * - POST /refresh and POST /logout use authenticate
 * - authenticate reads Bearer tokens from Authorization headers
 * - req.user is populated after token verification
 * - refresh token comes from the httpOnly cookie
 */

/**
 * Validation integration demonstrated by auth routes:
 * - signupValidation
 * - loginValidation
 * - forgotPasswordValidation
 * - resendOtpValidation
 * - verifyOtpValidation
 * - resetPasswordValidation
 */

export {};
