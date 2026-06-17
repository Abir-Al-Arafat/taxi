// src/modules/wallet/wallet.schema.ts
import { Schema, model } from "mongoose";
import type { IWallet, IWalletTransaction } from "./wallet.interface";

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "LYD", required: true },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE" },
  },
  { timestamps: true },
);

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    source: {
      type: String,
      enum: ["VOUCHER", "PROMO", "RIDE_PAYMENT", "ADMIN_ADJUSTMENT"],
      required: true,
    },
    referenceId: { type: String },
    description: { type: String },
  },
  { timestamps: true },
);

export const Wallet = model<IWallet>("Wallet", WalletSchema);
export const WalletTransaction = model<IWalletTransaction>(
  "WalletTransaction",
  WalletTransactionSchema,
);
