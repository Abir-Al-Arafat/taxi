// src/modules/wallet/wallet.interface.ts
import type { Document, Types } from "mongoose";

export type source = "VOUCHER" | "PROMO" | "RIDE_PAYMENT" | "ADMIN_ADJUSTMENT";

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
  type: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number; // Snapshot of balance for ledger auditing
  source: source;
  referenceId?: string; // ID linking to the specific voucher/ride
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
