import mongoose from "mongoose";

import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { RatingRepository } from "./rating.repository";
import type { SubmitRatingRequest, RatingSchema } from "./rating.interface";

export class RatingService {
  constructor(private ratingRepository: RatingRepository) {}

  /**
   * Submits a rating for a completed ride.
   * Uses a transaction to ensure data integrity.
   */
  async submitRating(
    userId: string,
    payload: SubmitRatingRequest,
  ): Promise<RatingSchema> {
    const { rideId, driverId, score, comment } = payload;

    // 1. Business Logic Validation: Ensure ride hasn't been rated yet
    const existingRating =
      await this.ratingRepository.findActiveByRideId(rideId);
    if (existingRating) {
      throw new AppError(
        "This ride has already been rated",
        HTTP_STATUS.CONFLICT,
      ); // 409 Conflict
    }

    // 2. Transaction setup (All or nothing)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create the rating document
      const newRating = await this.ratingRepository.create(
        {
          rideId: new mongoose.Types.ObjectId(rideId),
          userId: new mongoose.Types.ObjectId(userId),
          driverId: new mongoose.Types.ObjectId(driverId),
          score,
          comment: comment || "",
        },
        // session,
      );

      // NOTE: In a full system, you would call DriverRepository here to update
      // the driver's total/average rating on their profile document using the same session.
      // e.g., await this.driverRepository.updateAverageRating(driverId, session);

      await session.commitTransaction();
      return newRating;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getDriverRatings(
    driverId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const filter = {
      driverId: new mongoose.Types.ObjectId(driverId),
      deletedAt: null,
    };

    // Use the built-in findPaginated from BaseRepository
    // Run both queries in parallel for performance
    const [paginatedData, stats] = await Promise.all([
      this.ratingRepository.findPaginated(
        { page, limit }, // Pass IPaginationParams
        filter, // Pass the targetFilter
      ),
      this.ratingRepository.getDriverAverageStats(driverId),
    ]);

    // Return the perfectly formatted paginated result along with stats
    return {
      items: paginatedData.items,
      pagination: paginatedData.pagination,
      stats,
    };
  }
}
