import { Request, Response } from "express";
import { MessageService } from "./message.service";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import HTTP_STATUS from "../../constants/statusCodes";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";

const messageService = new MessageService();

export class MessageController {
  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const message = await messageService.sendMessage(userId, req.body);

    res
      .status(HTTP_STATUS.CREATED)
      .json(
        ResponseBuilder.success(
          "Message sent successfully",
          message,
          HTTP_STATUS.CREATED,
        ),
      );
  }

  async getConversation(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user!.userId;
    const { targetUserId } = req.params;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 50;
    const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;

    const messages = await messageService.getConversation(
      userId,
      targetUserId,
      limit,
      skip,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Conversation retrieved",
          messages,
          HTTP_STATUS.OK,
        ),
      );
  }

  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { senderId } = req.params;

    await messageService.markAsRead(userId, senderId);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Messages marked as read",
          undefined,
          HTTP_STATUS.OK,
        ),
      );
  }
}
