// src/modules/voucher/voucher.repository.ts
import { BaseRepository } from "../../repositories/base.repository";
import { Voucher, VoucherBatch } from "./voucher.schema";
import type { IVoucher, IVoucherBatch } from "./voucher.interface";

export class VoucherRepository extends BaseRepository<IVoucher> {
  constructor() {
    super(Voucher);
  }

  async getVoucherStats() {
    return this.model.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$value" },
        },
      },
    ]);
  }
}

export class VoucherBatchRepository extends BaseRepository<IVoucherBatch> {
  constructor() {
    super(VoucherBatch);
  }
}
