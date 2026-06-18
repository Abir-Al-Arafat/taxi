// src/modules/promo/promo.interface.ts
import type { Document, Types } from "mongoose";

export type DiscountType = "percentage" | "fixed_amount";
export type RuleKey = "user_type" | "total_rides" | "days_since_last_ride";
export type RuleOperator = "equals" | "greater_than" | "less_than";
export type UserType = "rider" | "driver";

export interface IPromoCode extends Document {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  totalUsageLimit: number;
  currentUsage: number;
  perUserLimit: number;
  startDate: Date;
  expiryDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPromoRule extends Document {
  promoCodeId: Types.ObjectId;
  ruleKey: RuleKey;
  ruleOperator: RuleOperator;
  ruleValue: string | number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPromoRedemption extends Document {
  promoCodeId: Types.ObjectId;
  userId: Types.ObjectId;
  userType: UserType;
  rideId?: Types.ObjectId; // Optional: Link to a specific ride
  discountApplied: number;
  redeemedAt: Date;
}
