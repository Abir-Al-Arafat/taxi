// src/modules/voucher/voucher.schema.ts
import { Schema, model } from "mongoose";
import type { IVoucher, IVoucherBatch } from "./voucher.interface";

const VoucherBatchSchema = new Schema<IVoucherBatch>(
  {
    batchName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, max: 1000 },
    value: { type: Number, required: true, min: 1 },
    expiryDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true },
);

const VoucherSchema = new Schema<IVoucher>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "VoucherBatch",
      required: true,
      index: true,
    },
    code: { type: String, required: true, unique: true, index: true },
    value: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["ACTIVE", "USED", "EXPIRED", "CANCELLED", "RESERVED"],
      default: "ACTIVE",
      index: true,
    },
    expiryDate: { type: Date },
    usedById: { type: String }, // Soft reference
    usedByName: { type: String }, // Soft reference for denormalization
    usedAt: { type: Date },
    walletAmountAfterRedemption: { type: Number },
  },
  { timestamps: true },
);

export const VoucherBatch = model<IVoucherBatch>(
  "VoucherBatch",
  VoucherBatchSchema,
);
export const Voucher = model<IVoucher>("Voucher", VoucherSchema);
