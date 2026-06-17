// src/modules/wallet/wallet.repository.ts
import { BaseRepository } from "../../repositories/base.repository";
import { Wallet, WalletTransaction } from "./wallet.schema";
import type { IWallet, IWalletTransaction } from "./wallet.interface";

export class WalletRepository extends BaseRepository<IWallet> {
  constructor() {
    super(Wallet);
  }
}

export class WalletTransactionRepository extends BaseRepository<IWalletTransaction> {
  constructor() {
    super(WalletTransaction);
  }
}
