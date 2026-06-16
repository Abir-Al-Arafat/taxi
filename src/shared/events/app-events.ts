// src/shared/events/app-events.ts
import { EventEmitter } from "events";
export const AppEventBus = new EventEmitter();

// Usage in future Wallet Module:
// AppEventBus.on("VOUCHER_REDEEMED", async (payload) => { walletService.topUp(...) });
