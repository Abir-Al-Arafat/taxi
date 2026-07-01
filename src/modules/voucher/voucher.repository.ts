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

  /**
   * Fetches paginated voucher usage data, including exact wallet updates
   */
  async getVoucherUsageReportData(
    skip: number,
    limit: number,
    search?: string,
  ) {
    const matchStage: any = {};

    // Enable searching by Voucher Code
    if (search) {
      matchStage.code = new RegExp(search.trim(), "i");
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },

            // Join Wallet Transactions to get the balance after redemption
            {
              $lookup: {
                from: "wallettransactions",
                // Convert Voucher _id to string as it's saved as string in referenceId
                let: { voucherIdStr: { $toString: "$_id" } },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$referenceId", "$$voucherIdStr"] },
                          { $eq: ["$source", "VOUCHER"] },
                        ],
                      },
                    },
                  },
                  { $limit: 1 }, // Only one transaction should match a voucher redemption
                ],
                as: "transaction",
              },
            },
            {
              $unwind: {
                path: "$transaction",
                preserveNullAndEmptyArrays: true,
              },
            },

            // Format output for the API response
            {
              $project: {
                _id: 0,
                id: "$_id",
                voucherCode: "$code",
                value: "$value",
                createdAt: "$createdAt",
                status: "$status", // e.g., "ACTIVE", "USED"
                usedByDriver: { $ifNull: ["$usedByName", "---"] },
                usedDate: "$usedAt",
                walletUpdate: "$transaction.balanceAfter",
              },
            },
          ],
        },
      },
    ];

    const result = await this.model.aggregate(pipeline).exec();

    return {
      items: result[0]?.data || [],
      totalCount: result[0]?.metadata[0]?.total || 0,
    };
  }
}

export class VoucherBatchRepository extends BaseRepository<IVoucherBatch> {
  constructor() {
    super(VoucherBatch);
  }
}
