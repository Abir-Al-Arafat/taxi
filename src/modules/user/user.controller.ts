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
}
