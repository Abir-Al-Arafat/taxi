// src/modules/promo/promo.schema.ts
import { Schema, model } from "mongoose";
import type {
  IPromoCode,
  IPromoRule,
  IPromoRedemption,
} from "./promo.interface";

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed_amount"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    totalUsageLimit: { type: Number, required: true, min: 1 },
    currentUsage: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const PromoRuleSchema = new Schema<IPromoRule>(
  {
    promoCodeId: {
      type: Schema.Types.ObjectId,
      ref: "PromoCode",
      required: true,
      index: true,
    },
    ruleKey: {
      type: String,
      enum: ["user_type", "total_rides", "days_since_last_ride"],
      required: true,
    },
    ruleOperator: {
      type: String,
      enum: ["equals", "greater_than", "less_than"],
      required: true,
    },
    ruleValue: { type: Schema.Types.Mixed, required: true }, // Can store "rider" (string) or 30 (number)
  },
  { timestamps: true },
);

const PromoRedemptionSchema = new Schema<IPromoRedemption>({
  promoCodeId: {
    type: Schema.Types.ObjectId,
    ref: "PromoCode",
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  userType: { type: String, enum: ["rider", "driver"], required: true },
  rideId: { type: Schema.Types.ObjectId, ref: "Ride" },
  discountApplied: { type: Number, required: true },
  redeemedAt: { type: Date, default: Date.now },
});

// Prevent users from bypassing the per-user limits via race conditions
PromoRedemptionSchema.index({ promoCodeId: 1, userId: 1 });

export const PromoCode = model<IPromoCode>("PromoCode", PromoCodeSchema);
export const PromoRule = model<IPromoRule>("PromoRule", PromoRuleSchema);
export const PromoRedemption = model<IPromoRedemption>(
  "PromoRedemption",
  PromoRedemptionSchema,
);
