// src/modules/voucher/voucher.interface.ts
import type { Document, Types } from "mongoose";

export type VoucherStatus =
  | "ACTIVE"
  | "USED"
  | "EXPIRED"
  | "CANCELLED"
  | "RESERVED";

export interface IVoucherBatch extends Document {
  batchName: string;
  quantity: number;
  value: number; // in LYD
  expiryDate?: Date | null;
  createdBy: Types.ObjectId; // Admin who created it
  createdAt: Date;
  updatedAt: Date;
}

export interface IVoucher extends Document {
  batchId: Types.ObjectId;
  code: string; // e.g., VC50LYD-[RANDOM]
  value: number;
  status: VoucherStatus;
  expiryDate?: Date;

  // Soft References for Driver Module decoupling
  usedById?: string;
  usedByName?: string;
  usedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// 🔌 Integration Point: Promo Code Strategy Pattern
export interface IPromoStrategy {
  applyPromo(baseValue: number, promoCode?: string): Promise<number>;
}
