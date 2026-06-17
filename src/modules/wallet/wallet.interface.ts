// src/modules/wallet/wallet.interface.ts
import type { Document, Types } from "mongoose";

export type TransactionSource =
  | "VOUCHER"
  | "PROMO"
  | "RIDE_PAYMENT"
  | "ADMIN_ADJUSTMENT";

export interface IWallet extends Document {
  userId: Types.ObjectId;
  balance: number;
  currency: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: Date;
  updatedAt: Date;
}

export interface IWalletTransaction extends Document {
  walletId: Types.ObjectId;
  userId: Types.ObjectId;
  adminId?: Types.ObjectId; // NEW: Audit trail for admin actions
  type: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  source: TransactionSource;
  referenceId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
