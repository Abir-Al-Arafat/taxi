// src/modules/fare/fare.interface.ts
import type { Document } from "mongoose";

export interface IFareRule extends Document {
  gender: "male" | "female" | "other"; // Extensible to match your user schema enum
  baseFare: number; // Stored in LYD
  minimumFare: number; // Stored in LYD
  pricePerMinute: number; // Stored in LYD
  pricePerKilometer: number; // Stored in LYD
  waitingTimeCharge: number; // Stored in LYD per min
  cancellationFee: number; // Stored in LYD
  commissionPercentage: number; // Percentage 0-100
  createdAt: Date;
  updatedAt: Date;
}
