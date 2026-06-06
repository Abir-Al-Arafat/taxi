/**
 * Golden Module Response Pattern Reference
 * Source of truth: src/core/utils/apiResponse.ts and src/modules/auth/auth.controller.ts
 *
 * Standard API response conventions:
 * - success boolean
 * - status number from src/constants/statusCodes.ts
 * - message string
 * - optional data payload
 */

/**
 * Success response structure used in the codebase:
 * {
 *   success: true,
 *   status: 201,
 *   message: "Login successful",
 *   data: { user, accessToken }
 * }
 */

/**
 * Error response structure used in the codebase:
 * {
 *   success: false,
 *   status: 404,
 *   message: "User not found"
 * }
 */

/**
 * Pagination response structure for future list endpoints:
 * {
 *   success: true,
 *   status: 200,
 *   message: "Items retrieved successfully",
 *   data: {
 *     items: [],
 *     total: 0,
 *     page: 1,
 *     limit: 10,
 *     totalPages: 0
 *   }
 * }
 *
 * Note: the current backend does not yet expose a paginated endpoint,
 * but this shape matches the project documentation and should be used
 * when list endpoints are introduced.
 */

/**
 * Real response examples in auth.controller.ts:
 * - ResponseBuilder.success("Server is running", undefined, HTTP_STATUS.OK)
 * - ResponseBuilder.success("Login successful", { user, accessToken }, HTTP_STATUS.OK)
 * - ResponseBuilder.success(result.message, undefined, HTTP_STATUS.OK)
 */

export {};
