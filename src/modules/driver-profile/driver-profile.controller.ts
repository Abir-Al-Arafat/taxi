import type { Request, Response } from "express";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { DriverProfileService } from "./driver-profile.service";
import type {
  CompleteDriverProfileRequest,
  UpdateDriverProfileRequest,
} from "./driver-profile.types";

export class DriverProfileController {
  constructor(
    private readonly driverProfileService = new DriverProfileService(),
  ) {}

  getStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const result = await this.driverProfileService.getStatus(userId);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Driver profile status retrieved successfully",
            result,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  getMyProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const profile = await this.driverProfileService.getMyProfile(userId);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Driver profile retrieved successfully",
            profile,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  completeProfile = asyncHandler(
    async (
      req: Request<unknown, unknown, CompleteDriverProfileRequest>,
      res: Response,
    ): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const profile = await this.driverProfileService.completeProfile(
        userId,
        req.body,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Driver profile completed successfully",
            profile,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  updateMyProfile = asyncHandler(
    async (
      req: Request<unknown, unknown, UpdateDriverProfileRequest>,
      res: Response,
    ): Promise<void> => {
      console.log("updateMyProfile");
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const profile = await this.driverProfileService.updateMyProfile(
        userId,
        req.body,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Driver profile updated successfully",
            profile,
            HTTP_STATUS.OK,
          ),
        );
    },
  );
}
