import { Request, Response } from "express";

import { AppError } from "../../core/errors/AppError";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import { asyncHandler } from "../../core/utils/asyncHandler";
import HTTP_STATUS from "../../constants/statusCodes";
import { RatingService } from "./rating.service";

export class RatingController {
  constructor(private ratingService: RatingService) {}

  public submitRating = asyncHandler(async (req: Request, res: Response) => {
    console.log("req.user:", req.user); // Debugging log
    // Note: req.user would be set by your auth.middleware
    const userId = (req as any).user?.id || req.user?.userId; // Fallback for testing without auth
    if (!userId) throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);

    const { rideId, driverId, score, comment } = req.body;

    // Basic Validation (Can be extracted to validation.middleware later)
    if (!rideId || !driverId || score === undefined) {
      throw new AppError(
        "Ride ID, Driver ID, and Score are required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (
      // typeof score !== "number" ||
      score < 1 ||
      score > 5
    ) {
      throw new AppError(
        "Score must be a number between 1 and 5",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const rating = await this.ratingService.submitRating(userId, {
      rideId,
      driverId,
      score,
      comment,
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json(
        ResponseBuilder.success(
          "Rating submitted successfully",
          rating,
          HTTP_STATUS.CREATED,
        ),
      );
  });

  public getDriverRatings = asyncHandler(
    async (req: Request, res: Response) => {
      const { driverId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!driverId)
        throw new AppError("Driver ID is required", HTTP_STATUS.BAD_REQUEST);

      const data = await this.ratingService.getDriverRatings(
        driverId as string,
        page,
        limit,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Driver ratings retrieved successfully",
            data,
            HTTP_STATUS.OK,
          ),
        );
    },
  );
  public getMyRatings = asyncHandler(async (req: Request, res: Response) => {
    console.log("req.user:", req.user);
    console.log("req.user.userId:", req.user.userId);
    const driverId = req.user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    console.log("Driver ID from token:", driverId);
    if (!driverId)
      throw new AppError("Driver ID is required", HTTP_STATUS.BAD_REQUEST);

    const data = await this.ratingService.getDriverRatings(
      driverId as string,
      page,
      limit,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Driver ratings retrieved successfully",
          data,
          HTTP_STATUS.OK,
        ),
      );
  });
}
