import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { SupportRepository } from "./support.repository";
import type {
  CreateTicketRequest,
  UpdateTicketRequest,
  ReplyTicketRequest,
  TicketMetricsResponse,
} from "./support.types";
import type {
  IPaginationParams,
  IPaginatedResult,
} from "../../shared/types/pagination.types";
import { Types } from "mongoose";
import { SupportTicketSchema } from "./support.schema";
import { status } from "./support.schema";
import { NotificationService } from "../notification/notification.service";
import type { SendNotificationRequest } from "../notification/notification.types";

export class SupportService {
  private supportRepository: SupportRepository;
  // private notificationService: NotificationService;
  constructor(private notificationService: NotificationService) {
    this.supportRepository = new SupportRepository();
  }

  async createTicket(userId: string, request: CreateTicketRequest) {
    if (request.rideId) {
      const isDuplicate = await this.supportRepository.findDuplicateOpenTicket(
        userId,
        request.rideId,
        request.subject,
      );

      if (isDuplicate) {
        throw new AppError(
          "An open ticket already exists for this ride and subject.",
          HTTP_STATUS.CONFLICT,
        );
      }
    }

    const ticketNumber = `SUP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const ticket = await this.supportRepository.create({
      ticketNumber,
      userId: new Types.ObjectId(userId),
      userType: request.userType,
      complaintAgainstId: request.complaintAgainstId
        ? new Types.ObjectId(request.complaintAgainstId)
        : undefined,
      complaintAgainstType: request.complaintAgainstType,
      rideId: request.rideId ? new Types.ObjectId(request.rideId) : undefined,
      subject: request.subject,
      description: request.description,
      status: "pending",
      issueDate: new Date(),
    } as Partial<SupportTicketSchema>);

    // TODO: Trigger notification to admin dashboard here

    return ticket;
  }

  async getTickets(
    params: IPaginationParams,
    status?: string,
    fieldsToPopulate: string[] = [],
  ) {
    const filter: Record<string, any> = { deletedAt: null };
    if (status) filter.status = status;
    return this.supportRepository.findPaginatedWithDynamicPopulation(
      params,
      filter,
      fieldsToPopulate,
      ["subject", "ticketNumber"],
    );
  }

  async getUserTickets(
    userId: string,
    params: IPaginationParams,
  ): Promise<IPaginatedResult<any>> {
    return this.supportRepository.findPaginated(
      params,
      { userId: new Types.ObjectId(userId), deletedAt: null },
      ["subject", "ticketNumber"],
    );
  }

  async getTicketById(ticketId: string) {
    const ticket = await this.supportRepository.findByIdWithDetails(ticketId);
    if (!ticket) {
      throw new AppError("Ticket not found", HTTP_STATUS.NOT_FOUND);
    }
    return ticket;
  }

  async getMetrics(): Promise<TicketMetricsResponse> {
    return this.supportRepository.getMetrics();
  }

  async updateTicketStatus(ticketId: string, updates: UpdateTicketRequest) {
    const ticket = await this.supportRepository.findOne({
      _id: new Types.ObjectId(ticketId),
    });
    if (!ticket) {
      throw new AppError("Ticket not found", HTTP_STATUS.NOT_FOUND);
    }

    if (updates.status === "solved" || updates.status === "rejected") {
      ticket.resolvedAt = new Date();
      if (!updates.adminReply && updates.status === "solved") {
        throw new AppError(
          "Admin reply is required to solve a ticket",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }

    if (updates.status) ticket.status = updates.status;
    if (updates.adminNotes) ticket.adminNotes = updates.adminNotes;
    if (updates.adminReply) ticket.adminReply = updates.adminReply;
    if (updates.resolutionDetails)
      ticket.resolutionDetails = updates.resolutionDetails;

    const updatedTicket = await this.supportRepository.updateOne(
      { _id: new Types.ObjectId(ticketId) },
      ticket,
    );

    // TODO: Send notification/email to user about status update

    return updatedTicket;
  }

  async replyToTicket(ticketId: string, replyPayload: ReplyTicketRequest) {
    const ticket: any = await this.supportRepository
      .findTicketById(ticketId)
      .populate("userId", "name phone email") // Populate userId
      .populate("complaintAgainstId", "name phone email") // Populate complaintAgainstId
      .exec();

    console.log("Ticket found for reply:", ticket);

    if (!ticket) {
      throw new AppError("Ticket not found", HTTP_STATUS.NOT_FOUND);
    }

    ticket.adminReply = replyPayload.adminReply || "";
    ticket.adminNotes = ticket.adminNotes || replyPayload.adminNotes || "";
    ticket.status = replyPayload.status as status;
    const updatedTicket = await this.supportRepository.updateOne(
      { _id: new Types.ObjectId(ticketId) },
      ticket,
    );

    console.log("replyPayload:", replyPayload);
    console.log(
      "replyPayload.sendNotification:",
      replyPayload.sendNotification,
    );
    console.log("User ID for notification:", ticket.userId._id);
    console.log("String(ticket.userId._id):", String(ticket.userId._id));
    console.log("ticket.userId.email:", ticket.userId.email);
    console.log("ticketId:", ticketId);

    if (replyPayload.sendNotification) {
      const notificationPayload: SendNotificationRequest = {
        userId: String(ticket.userId._id), // Assuming userId is stored as a string in the ticket schema
        userEmail: ticket.userId.email, // Assume available on ticket or fetched prior
        title: "Update on your Support Ticket",
        body: `An agent has replied to your ticket #${ticketId}.`,
        type: "SUPPORT_TICKET",
        channels: ["IN_APP", "EMAIL", "PUSH"], // Configure channels dynamically based on user prefs if needed
        data: {
          ticketId: ticketId,
          actionUrl: `/support/tickets/${ticketId}`,
        },
      };
      console.log("Notification payload to be sent:", notificationPayload);
      // We do not await this if we don't want to block the HTTP response,
      // but waiting ensures delivery success logic. Await is safer.
      await this.notificationService.send(notificationPayload);
    }

    return updatedTicket;
  }
}
