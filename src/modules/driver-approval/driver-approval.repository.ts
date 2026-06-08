import { Types } from "mongoose";
import { BaseRepository } from "../../repositories/base.repository";
import { UserModel, UserDocument } from "../auth/user.schema";
import type {
  IPaginationParams,
  IPaginatedResult,
} from "../../shared/types/pagination.types";

export interface IDriverApprovalQueryParams extends IPaginationParams {
  profileCompleted?: string;
  adminApproved?: string;
  vehicleType?: "taxi" | "normal car";
}

export class DriverApprovalRepository extends BaseRepository<UserDocument> {
  constructor() {
    super(UserModel);
  }

  /**
   * Advanced lookup featuring text searches, vehicle filtering, and concurrent facet pagination.
   */
  async findDriversWithProfiles(
    query: IDriverApprovalQueryParams,
  ): Promise<IPaginatedResult<any>> {
    const page = Math.max(1, query.page ? parseInt(String(query.page), 10) : 1);
    const limit = Math.max(
      1,
      query.limit ? parseInt(String(query.limit), 10) : 10,
    );
    const skip = (page - 1) * limit;
    const sortOrder = query.sort || "-createdAt";

    // 1. Core Match Stage: Filters based on base User attributes (Leverages the compound index)
    const baseUserMatch: Record<string, any> = { role: "driver" };

    if (query.profileCompleted !== undefined) {
      baseUserMatch.profileCompleted = query.profileCompleted === "true";
    }
    if (query.adminApproved !== undefined) {
      baseUserMatch.adminApproved = query.adminApproved;
    }

    // 2. Post-Join Match Stage: Handles searching across tables and deep field filtering
    const postJoinMatch: Record<string, any> = {};

    if (query.vehicleType) {
      postJoinMatch["profileDoc.vehicleType"] = query.vehicleType;
    }

    if (query.search) {
      const searchRegex = new RegExp(String(query.search).trim(), "i");
      postJoinMatch.$or = [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    // 3. Single-pass Aggregate execution with counting windows
    const pipelineResult = await UserModel.aggregate([
      { $match: baseUserMatch },
      {
        $lookup: {
          from: "driverprofiles", // lowercase plural name of target database collection
          localField: "_id",
          foreignField: "userId",
          as: "profileDoc",
        },
      },
      {
        $unwind: {
          path: "$profileDoc",
          preserveNullAndEmptyArrays: true, // Retain drivers who haven't uploaded images yet
        },
      },
      { $match: postJoinMatch },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: sortOrder === "-createdAt" ? -1 : 1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                passwordHash: 0,
                refreshTokenHash: 0,
                refreshTokenExpiresAt: 0,
                __v: 0,
                "profileDoc.__v": 0,
              },
            },
          ],
        },
      },
    ]);

    const totalItems = pipelineResult[0]?.metadata[0]?.total || 0;
    const items = pipelineResult[0]?.data || [];

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

  async findDriverById(id: string): Promise<UserDocument | null> {
    return this.model
      .aggregate([
        { $match: { _id: new Types.ObjectId(id), role: "driver" } },
        {
          $lookup: {
            from: "driverprofiles",
            localField: "_id",
            foreignField: "userId",
            as: "profileDoc",
          },
        },
        { $unwind: { path: "$profileDoc", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            passwordHash: 0,
            refreshTokenHash: 0,
            __v: 0,
            "profileDoc.__v": 0,
          },
        },
      ])
      .then((results) => results[0] || null);
  }
}
