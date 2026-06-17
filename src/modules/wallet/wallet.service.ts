// src/modules/wallet/wallet.service.ts
import { Types } from "mongoose";
import {
  WalletRepository,
  WalletTransactionRepository,
} from "./wallet.repository";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import type { IPaginationParams } from "../../shared/types/pagination.types";
import type { source } from "./wallet.interface";
export class WalletService {
  private walletRepo = new WalletRepository();
  private txRepo = new WalletTransactionRepository();

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
    source: source, // (or TransactionSource if you updated the name)
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
}
