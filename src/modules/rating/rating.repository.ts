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

  /**
   * Accepts an array of driver IDs and returns a Map of { driverId: averageScore }
   */
  async getAverageRatingsForDrivers(
    driverIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!driverIds || driverIds.length === 0) return map;

    const driverRatings = await Rating.aggregate([
      { $match: { driverId: { $in: driverIds } } },
      { $group: { _id: "$driverId", avg: { $avg: "$score" } } },
    ]);

    driverRatings.forEach((r) => map.set(r._id.toString(), r.avg));
    return map;
  }

  /**
   * Accepts an array of ride IDs and returns a Map of { rideId: averageScore }
   */
  async getAverageRatingsForRides(
    rideIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!rideIds || rideIds.length === 0) return map;

    const rideRatings = await Rating.aggregate([
      { $match: { rideId: { $in: rideIds } } },
      { $group: { _id: "$rideId", avg: { $avg: "$score" } } },
    ]);

    rideRatings.forEach((r) => map.set(r._id.toString(), r.avg));
    return map;
  }
}
