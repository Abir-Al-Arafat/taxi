import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { UserService } from "./user.service";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { env } from "../../config/env";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
  SignupRequest,
  VerifyOtpRequest,
} from "../auth/auth.types";
import { AuthRole } from "../auth/auth.types";

export class UserController {
  constructor(private readonly userService = new UserService()) {}

  getAllUsers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // 1. Passing URL query parameters down to the service layer
      const result = await this.userService.getAllUsers(req.query);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Users retrieved successfully",
            result,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.params.id;

      // Parse the query parameter (e.g., ?includeDriverProfile=true)
      const includeDriverProfile = req.query.includeDriverProfile === "true";

      if (!userId) {
        throw new AppError(
          "User ID parameter is required",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      // Pass both the userId and the boolean flag to the service
      const user = await this.userService.getUserById(
        userId as string,
        includeDriverProfile,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "User retrieved successfully",
            user,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  getMyDetails = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const user = await this.userService.getUserById(userId);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "User details retrieved successfully",
            user,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  updateMyDetails = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const updatedUser = await this.userService.updateMyDetails(
        userId,
        req.body,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "User details updated successfully",
            updatedUser,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  changePassword = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new AppError(
          "Current password, new password, and confirm password are required",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      if (newPassword !== confirmPassword) {
        throw new AppError(
          "New password and confirm password do not match",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const updatedUser = await this.userService.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Password changed successfully",
            updatedUser,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  toggleBlockStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.params.id;

      if (!userId) {
        throw new AppError(
          "User ID parameter is required",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const updatedUser = await this.userService.toggleBlockStatus(
        userId as string,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "User block status toggled successfully",
            updatedUser,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  toggleOnlineStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const updatedUser = await this.userService.toggleOnlineStatus(userId);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "User online status toggled successfully",
            updatedUser,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  /**
   * Get User/Driver overview chart data
   * GET /api/v1/users/overview?year=2024&role=rider
   */
  getUserOverview = asyncHandler(async (req: Request, res: Response) => {
    // 1. Parse and default queries
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const role = (req.query.role as string)?.toLowerCase() || "rider";

    // 2. Validate input
    if (role !== "rider" && role !== "driver") {
      throw new AppError(
        "Invalid role. Must be 'rider' or 'driver'",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new AppError("Invalid year provided", HTTP_STATUS.BAD_REQUEST);
    }

    // 3. Call Service
    const overviewData = await this.userService.getUserOverviewStats(
      year,
      role as AuthRole,
    );

    // 4. Format Response
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "User overview retrieved successfully",
          overviewData,
          HTTP_STATUS.OK,
        ),
      );
  });
}
