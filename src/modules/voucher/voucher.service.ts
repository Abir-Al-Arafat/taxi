// src/modules/voucher/voucher.service.ts
import crypto from "crypto";
import {
  VoucherRepository,
  VoucherBatchRepository,
} from "./voucher.repository";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppEventBus } from "../../shared/events/app-events";
import { StandardPromoStrategy } from "./strategies/base-promo.strategy";
import type { IPaginationParams } from "../../shared/types/pagination.types";
import type { IPromoStrategy, VoucherStatus } from "./voucher.interface";

export class VoucherService {
  private voucherRepo = new VoucherRepository();
  private batchRepo = new VoucherBatchRepository();

  // Injectable strategy pattern for future promo integrations
  constructor(
    private promoStrategy: IPromoStrategy = new StandardPromoStrategy(),
  ) {}

  async generateBatch(
    adminId: string,
    payload: {
      quantity: number;
      value: number;
      batchName?: string;
      expiryDate?: string;
    },
  ) {
    if (payload.quantity > 1000)
      throw new AppError(
        "Maximum 1000 vouchers per batch allowed",
        HTTP_STATUS.BAD_REQUEST,
      );

    // 1. Create Batch Record
    const batch = await this.batchRepo.create({
      batchName: payload.batchName || `Batch-${Date.now()}`,
      quantity: payload.quantity,
      value: payload.value,
      expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
      createdBy: adminId as any,
    });

    // 2. Generate secure unique codes (Predictable sequences like 001, 002 are security risks for vouchers)
    const vouchers = Array.from({ length: payload.quantity }).map(() => ({
      batchId: batch._id,
      code: `VC${payload.value}LYD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      value: payload.value,
      expiryDate: batch.expiryDate,
      status: "ACTIVE",
    }));

    // 3. Bulk Insert
    await this.voucherRepo.insertMany(vouchers);
    return batch;
  }

  async listVouchers(params: IPaginationParams, queryFilters: any) {
    const filters: any = {};
    if (queryFilters.status) filters.status = queryFilters.status;
    if (queryFilters.batchId) filters.batchId = queryFilters.batchId;

    return this.voucherRepo.findPaginated(params, filters, [
      "code",
      "usedByName",
    ]);
  }

  async listBatches(params: IPaginationParams) {
    return this.batchRepo.findPaginated(params, {}, ["batchName"]);
  }

  async getVoucherByCode(code: string) {
    const voucher = await this.voucherRepo.findOne({ code });
    if (!voucher)
      throw new AppError("Voucher not found", HTTP_STATUS.NOT_FOUND);
    return voucher;
  }

  async updateStatus(voucherId: string, status: VoucherStatus) {
    const updated = await this.voucherRepo.updateOne(
      { _id: voucherId },
      { status },
    );
    if (!updated)
      throw new AppError("Voucher not found", HTTP_STATUS.NOT_FOUND);
    return updated;
  }

  async getStats() {
    return this.voucherRepo.getVoucherStats();
  }

  // --- REDEMPTION FLOW ---
  async redeemVoucher(
    code: string,
    driverId: string,
    driverName: string,
    promoCode?: string,
  ) {
    const voucher = await this.voucherRepo.findOne({ code });

    if (!voucher)
      throw new AppError("Invalid voucher code", HTTP_STATUS.NOT_FOUND);
    if (voucher.status !== "ACTIVE")
      throw new AppError(
        `Voucher is currently ${voucher.status}`,
        HTTP_STATUS.BAD_REQUEST,
      );
    if (voucher.expiryDate && new Date() > voucher.expiryDate) {
      await this.updateStatus(voucher._id as any, "EXPIRED");
      throw new AppError("Voucher has expired", HTTP_STATUS.BAD_REQUEST);
    }

    // 🔌 Strategy Pattern: Calculate final value if a promo code is provided
    const finalCreditAmount = await this.promoStrategy.applyPromo(
      voucher.value,
      promoCode,
    );

    // Update Voucher State using Soft References
    const redeemedVoucher = await this.voucherRepo.updateOne(
      { _id: voucher._id, status: "ACTIVE" }, // concurrency check
      {
        status: "USED",
        usedById: driverId,
        usedByName: driverName,
        usedAt: new Date(),
      },
    );

    if (!redeemedVoucher)
      throw new AppError(
        "Failed to redeem. Voucher may have just been used.",
        HTTP_STATUS.CONFLICT,
      );

    // 🔌 Wallet Integration: Fire-and-forget Event
    AppEventBus.emit("WALLET_TOP_UP_REQUESTED", {
      driverId,
      amount: finalCreditAmount,
      source: "VOUCHER",
      referenceId: voucher._id,
    });

    return { voucherCode: voucher.code, creditedAmount: finalCreditAmount };
  }
}
