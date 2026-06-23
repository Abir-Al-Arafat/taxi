import { Schema, model } from "mongoose";

import type { RatingSchema } from "./rating.interface";

const ratingSchema = new Schema<RatingSchema>(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
      unique: true, // One rating per ride
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Rating = model<RatingSchema>("Rating", ratingSchema);

export { Rating };
