// src/modules/wallet/wallet.service.ts
import { Types } from "mongoose";
import {
  WalletRepository,
  WalletTransactionRepository,
} from "./wallet.repository";
import { UserRepository } from "../user/user.repository";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import type { IPaginationParams } from "../../shared/types/pagination.types";
import type { TransactionSource } from "./wallet.interface";
export class WalletService {
  private walletRepo = new WalletRepository();
  private txRepo = new WalletTransactionRepository();
  private userRepo = new UserRepository();

  /**
   * Fetches a wallet, automatically generating one if it doesn't exist yet
   * (e.g., for legacy users who signed up before the wallet module existed).
   */
  async getOrCreateWallet(userId: string) {
    let wallet = await this.walletRepo.findOne({ userId });
    if (!wallet) {
      wallet = await this.walletRepo.create({
        userId: new Types.ObjectId(userId),
        balance: 0,
        currency: "LYD",
        status: "ACTIVE",
      });
    }
    return wallet;
  }

  async getMyBalance(userId: string) {
    return this.getOrCreateWallet(userId);
  }

  async getMyTransactions(userId: string, params: IPaginationParams) {
    // Requires users to have a wallet generated first
    await this.getOrCreateWallet(userId);
    return this.txRepo.findPaginated(params, { userId });
  }

  /**
   * Atomically credits the wallet to prevent race conditions during concurrent top-ups
   */
  // src/modules/wallet/wallet.service.ts

  // src/modules/wallet/wallet.service.ts

  async addCredit(
    userId: string,
    amount: number,
    source: TransactionSource,
    referenceId?: string,
    description?: string,
  ) {
    const wallet = await this.getOrCreateWallet(userId);

    const updatedWallet = await this.walletRepo.updateOne(
      { _id: wallet._id, status: "ACTIVE" },
      { $inc: { balance: amount } },
    );

    if (!updatedWallet) {
      throw new AppError(
        "Wallet top-up failed. Wallet may be suspended.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 1. Build the base transaction object with strictly required fields
    const txData: any = {
      walletId: wallet._id,
      userId: wallet.userId,
      type: "CREDIT",
      amount,
      balanceAfter: updatedWallet.balance,
      source,
    };

    // 2. Conditionally append optional fields ONLY if they are defined
    if (referenceId !== undefined) {
      txData.referenceId = referenceId;
    }

    if (description !== undefined) {
      txData.description = description;
    }

    // 3. Save the clean object
    await this.txRepo.create(txData);

    return updatedWallet;
  }

  async getAdminWalletDashboard(params: IPaginationParams, filters: any = {}) {
    return this.walletRepo.getAdminDashboardList(params, filters);
  }

  async adminTopUpWallet(
    adminId: string,
    driverId: string,
    amount: number,
    description?: string,
  ) {
    // 1. Validate Driver Exists
    const driver = await this.userRepo.findOne({
      _id: driverId,
      role: "driver",
    });
    if (!driver)
      throw new AppError(
        "Driver not found or invalid role",
        HTTP_STATUS.NOT_FOUND,
      );

    // 2. Get/Create Wallet
    const wallet = await this.getOrCreateWallet(driverId);

    // 3 & 4 & 5. Atomic Update natively prevents concurrency collisions
    const updatedWallet = await this.walletRepo.updateOne(
      { _id: wallet._id, status: "ACTIVE" },
      { $inc: { balance: amount } },
    );

    if (!updatedWallet)
      throw new AppError(
        "Wallet top-up failed. Wallet may be suspended.",
        HTTP_STATUS.BAD_REQUEST,
      );

    // 6. Record transaction
    const txData: any = {
      walletId: wallet._id,
      userId: wallet.userId,
      adminId,
      type: "CREDIT",
      amount,
      balanceAfter: updatedWallet.balance,
      source: "ADMIN_ADJUSTMENT",
    };
    if (description) txData.description = description;

    const transaction = await this.txRepo.create(txData);

    return { updatedBalance: updatedWallet.balance, transaction };
  }

  async deductSystemCommission(
    driverId: string,
    amount: number,
    rideId: string,
  ) {
    const wallet = await this.getOrCreateWallet(driverId);

    // EDGE CASE: We intentionally allow the balance to drop below 0.
    // Since the driver got physical cash, they owe the platform this commission.
    const updatedWallet = await this.walletRepo.updateOne(
      { _id: wallet._id },
      { $inc: { balance: -amount } },
    );

    if (!updatedWallet) {
      throw new AppError(
        "Failed to process system commission",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    // Record the commission transaction
    await this.txRepo.create({
      walletId: wallet._id,
      userId: new Types.ObjectId(driverId),
      type: "DEBIT",
      amount,
      balanceAfter: updatedWallet.balance,
      source: "COMMISSION",
      description: `Commission deducted for cash ride: ${rideId}`,
    });

    // Optional: If balance is highly negative (e.g., -500), you can emit an event here to suspend the driver's account.

    return updatedWallet;
  }

  async adminDeductWallet(
    adminId: string,
    driverId: string,
    amount: number,
    description?: string,
  ) {
    // 1. Validate Driver Exists
    const driver = await this.userRepo.findOne({
      _id: driverId,
      role: "driver",
    });
    if (!driver)
      throw new AppError(
        "Driver not found or invalid role",
        HTTP_STATUS.NOT_FOUND,
      );

    const wallet = await this.getOrCreateWallet(driverId);

    // 2, 3, 4, 5. ATOMIC DEDUCTION: The `{ balance: { $gte: amount } }` query completely eliminates
    // negative balance risks and concurrent double-spend race conditions at the database level.
    const updatedWallet = await this.walletRepo.updateOne(
      { _id: wallet._id, status: "ACTIVE", balance: { $gte: amount } },
      { $inc: { balance: -amount } },
    );

    if (!updatedWallet) {
      // Differentiate between suspended wallet and insufficient funds
      const current = await this.walletRepo.findOne({ _id: wallet._id });
      if (current && current.balance < amount) {
        throw new AppError(
          `Insufficient balance. Current balance is ${current.balance} LYD.`,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      throw new AppError(
        "Wallet deduction failed. Wallet may be suspended.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 6. Record transaction
    const txData: any = {
      walletId: wallet._id,
      userId: wallet.userId,
      adminId,
      type: "DEBIT",
      amount,
      balanceAfter: updatedWallet.balance,
      source: "ADMIN_ADJUSTMENT",
    };
    if (description) txData.description = description;

    const transaction = await this.txRepo.create(txData);

    return { updatedBalance: updatedWallet.balance, transaction };
  }

  async getAdminGlobalTransactions(
    params: IPaginationParams,
    filters: any = {},
  ) {
    return this.txRepo.getGlobalTransactionsList(params, filters);
  }
}
