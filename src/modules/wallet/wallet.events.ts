// src/modules/wallet/wallet.events.ts
import { AppEventBus } from "../../shared/events/app-events";
import { WalletService } from "./wallet.service";
import { source } from "./wallet.interface";

const walletService = new WalletService();

// 1. Automatically provision wallets instantly when a driver completes signup
AppEventBus.on("USER_REGISTERED", async (payload: { userId: string }) => {
  try {
    await walletService.getOrCreateWallet(payload.userId);
    console.log(`Successfully auto-created wallet for user ${payload.userId}`);
  } catch (error) {
    console.error(
      `Failed to auto-create wallet for user ${payload.userId}:`,
      error,
    );
  }
});

// 2. Process Voucher Redemptions decoupled from HTTP request timelines
AppEventBus.on(
  "WALLET_TOP_UP_REQUESTED",
  async (payload: {
    driverId: string;
    amount: number;
    source: source;
    referenceId: string;
  }) => {
    try {
      await walletService.addCredit(
        payload.driverId,
        payload.amount,
        payload.source,
        payload.referenceId,
        "Voucher Redemption Top-Up",
      );
      console.log(
        `Successfully processed wallet top-up for driver ${payload.driverId} from source ${payload.source}`,
      );
    } catch (error) {
      console.error(
        `Failed to process wallet top-up for driver ${payload.driverId}:`,
        error,
      );
    }
  },
);
