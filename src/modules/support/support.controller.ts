import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";
import { SupportService } from "./support.service";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export class SupportController {
  constructor(private supportService: SupportService) {}

  createTicket = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user || (!req.user as any)?.userId) {
        throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
      }

      const userId = req.user.userId as string;

      if (!req.body.subject || !req.body.description || !req.body.userType) {
        throw new AppError("Missing required fields", HTTP_STATUS.BAD_REQUEST);
      }

      const ticket = await this.supportService.createTicket(userId, req.body);
      res
        .status(HTTP_STATUS.CREATED)
        .json(
          ResponseBuilder.success(
            "Support ticket created successfully",
            ticket,
            HTTP_STATUS.CREATED,
          ),
        );
    },
  );

  getTickets = asyncHandler(async (req: Request, res: Response) => {
    const tickets = await this.supportService.getTickets(req.query);
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Tickets retrieved successfully",
          tickets,
          HTTP_STATUS.OK,
        ),
      );
  });

  getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const metrics = await this.supportService.getMetrics();
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Metrics retrieved successfully",
          metrics,
          HTTP_STATUS.OK,
        ),
      );
  });

  getTicketById = asyncHandler(async (req: Request, res: Response) => {
    const ticket = await this.supportService.getTicketById(
      req.params.id as string,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Ticket retrieved successfully",
          ticket,
          HTTP_STATUS.OK,
        ),
      );
  });

  getUserTickets = asyncHandler(async (req: Request, res: Response) => {
    const tickets = await this.supportService.getUserTickets(
      req.params.userId as string,
      req.query,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "User tickets retrieved successfully",
          tickets,
          HTTP_STATUS.OK,
        ),
      );
  });

  updateTicket = asyncHandler(async (req: Request, res: Response) => {
    const updatedTicket = await this.supportService.updateTicketStatus(
      req.params.id as string,
      req.body,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Ticket updated successfully",
          updatedTicket,
          HTTP_STATUS.OK,
        ),
      );
  });

  replyToTicket = asyncHandler(async (req: Request, res: Response) => {
    if (!req.body.message) {
      throw new AppError("Message is required", HTTP_STATUS.BAD_REQUEST);
    }
    const result = await this.supportService.replyToTicket(
      req.params.id as string,
      req.body,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Reply sent successfully",
          result,
          HTTP_STATUS.OK,
        ),
      );
  });
}
