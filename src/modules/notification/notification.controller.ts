import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { NotificationService } from "./notification.service";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  getMyNotifications = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const notifications =
        await this.notificationService.getMyNotifications(userId);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Notifications retrieved successfully",
            notifications,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  markAsRead = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      const notificationId = req.params.id;

      if (!userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const notification = await this.notificationService.markAsRead(
        userId,
        notificationId as string,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Notification marked as read",
            notification,
            HTTP_STATUS.OK,
          ),
        );
    },
  );
}
