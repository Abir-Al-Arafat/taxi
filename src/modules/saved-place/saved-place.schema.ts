import { Schema, model } from "mongoose";
import type { ISavedPlace } from "./saved-place.interface";

const SavedPlaceSchema = new Schema<ISavedPlace>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true }, // Expects [lng, lat]
    },
  },
  { timestamps: true },
);

// Optimize spatial queries and prevent duplicate names per user (e.g., two "Home"s)
SavedPlaceSchema.index({ location: "2dsphere" });
SavedPlaceSchema.index({ userId: 1, name: 1 }, { unique: true });

export const SavedPlace = model<ISavedPlace>("SavedPlace", SavedPlaceSchema);
