/**
 * Golden Module Controller Reference
 * Source of truth: src/modules/auth/auth.controller.ts
 *
 * Controller responsibilities in this codebase:
 * - accept typed Express requests
 * - delegate all business logic to the service
 * - format HTTP responses with ResponseBuilder
 * - keep controller methods thin
 * - let asyncHandler forward errors to error.middleware
 */

import type { Request, Response } from "express";

/**
 * Real controller pattern used in the project:
 *
 * export class AuthController {
 *   private readonly jwtService = new JwtService();
 *
 *   constructor(private readonly authService = new AuthService()) {}
 * }
 */

export class GoldenModuleController {
  constructor(private readonly service: unknown) {}

  /**
   * Request handling flow
   * 1. Read req.body / req.params / req.query / cookies
   * 2. Pass validated data to the service
   * 3. Format a ResponseBuilder.success() payload
   * 4. Return the response
   */
  create = async (_req: Request, _res: Response): Promise<void> => {
    // In auth.controller.ts the service calls are direct and thin:
    // - signup(req.body)
    // - login(req.body)
    // - forgotPassword(req.body)
    // - resendOtp(req.body)
    // - verifyOtp(req.body)
    // - resetPassword(req.body)
    // - refresh(userId, refreshToken)
    // - logout(userId)
    // Validation flow happens before the controller in the route layer.
    // If the service throws AppError, asyncHandler forwards it to error middleware.
  };
}

/**
 * Response formatting flow demonstrated by the auth controller:
 * - success with data: ResponseBuilder.success("Login successful", { user, accessToken }, HTTP_STATUS.OK)
 * - message only: ResponseBuilder.success("Password reset successfully", undefined, HTTP_STATUS.OK)
 * - OTP verification: ResponseBuilder.success(result.message, result.user, HTTP_STATUS.OK)
 */

export {};
