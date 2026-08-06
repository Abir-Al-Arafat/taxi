import { Schema, model, Types, Document } from "mongoose";

export interface IRecentPlace extends Document {
  userId: Types.ObjectId;
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  lastUsedAt: Date;
}

const RecentPlaceSchema = new Schema<IRecentPlace>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coordinates: { type: [Number], required: true },
    address: { type: String, default: "" }, // Optional: Populate if frontend sends it
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Prevent duplicate exact coordinate entries per user.
// If they search the same place again, we will just update 'lastUsedAt'.
RecentPlaceSchema.index(
  { userId: 1, "coordinates.0": 1, "coordinates.1": 1 },
  { unique: true },
);

export const RecentPlace = model<IRecentPlace>(
  "RecentPlace",
  RecentPlaceSchema,
);
