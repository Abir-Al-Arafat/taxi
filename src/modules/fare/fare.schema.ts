// src/modules/fare/fare.schema.ts
import { Schema, model } from "mongoose";
import type { IFareRule } from "./fare.interface";

const FareRuleSchema = new Schema<IFareRule>(
  {
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
      // unique: true, // Ensures only one active rule per gender exists natively
    },
    vehicleType: {
      type: String,
      required: true,
      enum: ["taxi", "normal car"],
    },
    baseFare: { type: Number, required: true, min: 0 },
    minimumFare: { type: Number, required: true, min: 0 },
    pricePerMinute: { type: Number, required: true, min: 0 },
    pricePerKilometer: { type: Number, required: true, min: 0 },
    waitingTimeCharge: { type: Number, required: true, min: 0 },
    cancellationFee: { type: Number, required: true, min: 0 },
    commissionPercentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true },
);

FareRuleSchema.index({ gender: 1, vehicleType: 1 }, { unique: true });

export const FareRule = model<IFareRule>("FareRule", FareRuleSchema);
