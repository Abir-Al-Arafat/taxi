import type { Request, Response } from "express";
import { DriverApprovalService } from "./driver-approval.service";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";

export class DriverApprovalController {
  private driverApprovalService = new DriverApprovalService();

  getAllDrivers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const completed = req.query.profileCompleted as string | undefined;
      const status = req.query.adminApproved as string | undefined;

      const drivers = await this.driverApprovalService.listDrivers({
        completed: completed as string,
        status: status as string,
      });

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Drivers fetched successfully for evaluation",
            { drivers },
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  handleApprovalAction = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { driverId } = req.params;
      const { action } = req.body; // Expects: "accept" | "decline"

      if (!action || !["accept", "decline"].includes(action)) {
        throw new AppError(
          "Invalid administrative action payload structural choice",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const updatedUser = await this.driverApprovalService.processApproval(
        driverId as string,
        action,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            `Driver status has been updated to: ${updatedUser.adminApproved}`,
            { driverId, adminApproved: updatedUser.adminApproved },
            HTTP_STATUS.OK,
          ),
        );
    },
  );
}
