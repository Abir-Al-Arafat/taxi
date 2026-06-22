// src/modules/ride/ride.schema.ts
import { Schema, model } from "mongoose";
import type { IRide } from "./ride.interface";

const LocationSchema = new Schema({
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], required: true }, // [longitude, latitude]
  address: { type: String, required: true },
});

const RideSchema = new Schema<IRide>(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driverId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    pickup: { type: LocationSchema, required: true },
    destination: { type: LocationSchema, required: true },
    stopovers: { type: [LocationSchema], default: [] },
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "ACCEPTED",
        "ARRIVED",
        "IN_PROGRESS",
        "PAYMENT_PENDING",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "REQUESTED",
      index: true,
    },
    vehicleType: { type: String, enum: ["taxi", "normal car"], required: true },
    preferredGender: {
      type: String,
      enum: ["male", "female", "any"],
      default: "any",
    },
    distanceKm: { type: Number, required: true },
    estimatedTimeMins: { type: Number, required: true },

    fareDetails: {
      baseFare: { type: Number, default: 0 },
      distanceFare: { type: Number, default: 0 },
      timeFare: { type: Number, default: 0 },
      waitingCharge: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      totalFare: { type: Number, required: true },
    },
    promoCode: { type: String },

    requestedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    arrivedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

// Geospatial index to quickly find rides near a driver
RideSchema.index({ pickup: "2dsphere" });

export const Ride = model<IRide>("Ride", RideSchema);
