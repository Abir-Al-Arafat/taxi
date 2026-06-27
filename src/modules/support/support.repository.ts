import { Model, Types } from "mongoose";
import { BaseRepository } from "../../repositories/base.repository";
import { SupportTicket, type SupportTicketSchema } from "./support.schema";
import type { TicketMetricsResponse } from "./support.types";

export class SupportRepository extends BaseRepository<SupportTicketSchema> {
  constructor() {
    super(SupportTicket);
  }

  /**
   * Check for an existing open ticket to prevent duplicates
   */
  async findDuplicateOpenTicket(
    userId: string,
    rideId: string,
    subject: string,
  ): Promise<SupportTicketSchema | null> {
    return this.findOne({
      userId: new Types.ObjectId(userId),
      rideId: new Types.ObjectId(rideId),
      subject,
      status: "pending",
      deletedAt: null,
    });
  }

  /**
   * Populate references for single ticket view
   */
  async findByIdWithDetails(ticketId: string): Promise<any> {
    return this.model
      .findOne({ _id: new Types.ObjectId(ticketId), deletedAt: null })
      .populate("userId", "name phone email role")
      .populate("complaintAgainstId", "name phone email role")
      .populate("rideId")
      .lean()
      .exec();
  }

  /**
   * Get dashboard ticket metrics
   */
  async getMetrics(): Promise<TicketMetricsResponse> {
    const stats = await this.model.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      resolved: 0,
      pending: 0,
      rejected: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      if (stat._id === "solved") result.resolved = stat.count;
      else if (stat._id === "pending") result.pending = stat.count;
      else if (stat._id === "rejected") result.rejected = stat.count;
    });

    return result;
  }
}
