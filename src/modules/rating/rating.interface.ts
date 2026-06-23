import { Document, Types } from "mongoose";

export interface RatingSchema extends Document {
  _id: Types.ObjectId;
  rideId: Types.ObjectId;
  userId: Types.ObjectId; // The rider giving the rating
  driverId: Types.ObjectId; // The driver receiving the rating
  score: number; // 1 to 5 (floats allowed)
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface SubmitRatingRequest {
  rideId: string;
  driverId: string;
  score: number;
  comment?: string;
}

export interface RatingAverageResult {
  averageRating: number;
  totalRatings: number;
}
