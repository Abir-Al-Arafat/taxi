import { Types, ClientSession } from "mongoose";

import { BaseRepository } from "../../repositories/base.repository";

import { Rating } from "./rating.schema";
import type { RatingSchema, RatingAverageResult } from "./rating.interface";

export class RatingRepository extends BaseRepository<RatingSchema> {
  constructor() {
    super(Rating);
  }

  async findActiveByRideId(
    rideId: string,
    session?: ClientSession,
  ): Promise<RatingSchema | null> {
    return this.findOne(
      { rideId: new Types.ObjectId(rideId), deletedAt: null },
      session,
    );
  }

  async getDriverAverageStats(driverId: string): Promise<RatingAverageResult> {
    const result = await this.model.aggregate([
      {
        $match: {
          driverId: new Types.ObjectId(driverId),
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$score" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return { averageRating: 0, totalRatings: 0 };
    }

    return {
      averageRating: Number(result[0].averageRating.toFixed(2)),
      totalRatings: result[0].totalRatings,
    };
  }
}
