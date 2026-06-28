import { Model, Types } from "mongoose";
import { BaseRepository } from "../../repositories/base.repository";
import { SupportTicket, type SupportTicketSchema } from "./support.schema";
import type { TicketMetricsResponse } from "./support.types";
import type { IPaginationParams } from "../../shared/types/pagination.types";

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

  async findPaginatedWithDynamicPopulation(
    params: IPaginationParams,
    filter: Record<string, any>,
    populateFields: string[],
    searchableFields: string[] = [],
  ) {
    const page = Math.max(
      1,
      params.page ? parseInt(String(params.page), 10) : 1,
    );
    const limit = Math.max(
      1,
      params.limit ? parseInt(String(params.limit), 10) : 10,
    );
    const skip = (page - 1) * limit;

    // 1. Build the Search Filter
    const finalFilter: Record<string, any> = { ...filter };
    // const searchableFields = ["subject", "ticketNumber"]; // Define fields to search here

    if (params.search && searchableFields.length > 0) {
      const searchRegex = new RegExp(String(params.search).trim(), "i");
      finalFilter.$or = searchableFields.map((field) => ({
        [field]: searchRegex,
      }));
    }

    // 2. Build the Query
    let query = this.model
      .find(finalFilter) // Use finalFilter (with search)
      .sort(params.sort || "-createdAt")
      .skip(skip)
      .limit(limit);

    // 3. Apply Population
    populateFields.forEach((field) => {
      if (field === "userId" || field === "complaintAgainstId") {
        query = query.populate(
          field,
          "firstName lastName phoneNumber email role",
        );
      }
      if (field === "rideId") {
        query = query.populate("rideId");
      }
    });

    // 4. Execute
    const [items, totalItems] = await Promise.all([
      query.lean().exec(),
      this.model.countDocuments(finalFilter).exec(), // Use finalFilter here too
    ]);

    return {
      items,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }
}
