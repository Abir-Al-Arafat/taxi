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

export class UserController {
  constructor(private readonly userService = new UserService()) {}

  getAllUsers = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
      const users = await this.userService.getAllUsers();

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Users retrieved successfully",
            users,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.params.id;
      const user = await this.userService.getUserById(userId as string);

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
}
