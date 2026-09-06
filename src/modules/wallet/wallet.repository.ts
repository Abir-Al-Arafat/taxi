// src/modules/wallet/wallet.repository.ts
import { BaseRepository } from "../../repositories/base.repository";
import { Wallet, WalletTransaction } from "./wallet.schema";
import type { IWallet, IWalletTransaction } from "./wallet.interface";
import type { IPaginationParams } from "../../shared/types/pagination.types";

export class WalletRepository extends BaseRepository<IWallet> {
  constructor() {
    super(Wallet);
  }

  async getAdminDashboardList(params: IPaginationParams, filters: any = {}) {
    console.log("getAdminDashboardList() called with params:", params);
    const page = Math.max(1, parseInt(String(params.page || 1), 10));
    const limit = Math.max(1, parseInt(String(params.limit || 10), 10));
    const skip = (page - 1) * limit;

    const searchRegex = params.search
      ? new RegExp(String(params.search).trim(), "i")
      : null;
    const sortField = params.sort ? params.sort.replace("-", "") : "createdAt";
    const sortDir = params.sort?.startsWith("-") ? -1 : 1;

    const pipeline: any[] = [
      // 1. Join User to ensure they are a driver and to support deep text search
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: false } },
      { $match: { ...filters } },
    ];

    if (searchRegex) {
      pipeline.push({
        $match: {
          $or: [
            { "userDoc.firstName": searchRegex },
            { "userDoc.lastName": searchRegex },
            { "userDoc.phoneNumber": searchRegex },
            { "userDoc.email": searchRegex },
          ],
        },
      });
    }

    // 2. Fetch Total Deductions (Sum of all DEBIT transactions)
    pipeline.push({
      $lookup: {
        from: "wallettransactions",
        let: { wId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$walletId", "$$wId"] },
                  { $eq: ["$type", "DEBIT"] },
                ],
              },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ],
        as: "deductionsData",
      },
    });

    // 3. Fetch Total Earnings (Sum of totalFare for COMPLETED rides)
    pipeline.push({
      $lookup: {
        from: "rides",
        let: { driverUserId: "$userId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$driverId", "$$driverUserId"] },
                  { $eq: ["$status", "COMPLETED"] },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$fareDetails.totalFare" },
            },
          },
        ],
        as: "earningsData",
      },
    });

    // 4. Fetch Last Transaction Detail
    pipeline.push({
      $lookup: {
        from: "wallettransactions",
        let: { wId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$walletId", "$$wId"] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "lastTxData",
      },
    });

    // 5. Facet for Pagination and Formatting
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { [sortField]: sortDir } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              userId: "$userDoc._id",
              name: {
                $concat: ["$userDoc.firstName", " ", "$userDoc.lastName"],
              },
              phone: "$userDoc.phoneNumber",
              wallet_balance: "$balance",
              total_earnings: {
                $ifNull: [{ $arrayElemAt: ["$earningsData.total", 0] }, 0],
              },
              total_deductions: {
                $ifNull: [{ $arrayElemAt: ["$deductionsData.total", 0] }, 0],
              },
              status: 1,
              last_transaction: { $arrayElemAt: ["$lastTxData", 0] },
            },
          },
        ],
      },
    });

    const result = await this.model.aggregate(pipeline);
    const totalItems = result[0]?.metadata[0]?.total || 0;
    // console.log("getAdminDashboardList() result:", result);
    // console.log("getAdminDashboardList() result:", result[0]);
    // console.log("getAdminDashboardList() result:", result[0]?.data);
    return {
      items: result[0]?.data || [],
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }
}

export class WalletTransactionRepository extends BaseRepository<IWalletTransaction> {
  constructor() {
    super(WalletTransaction);
  }

  async getGlobalTransactionsList(
    params: IPaginationParams,
    filters: any = {},
  ) {
    const page = Math.max(1, parseInt(String(params.page || 1), 10));
    const limit = Math.max(1, parseInt(String(params.limit || 10), 10));
    const skip = (page - 1) * limit;

    const searchRegex = params.search
      ? new RegExp(String(params.search).trim(), "i")
      : null;
    const sortField = params.sort ? params.sort.replace("-", "") : "createdAt";
    const sortDir = params.sort?.startsWith("-") ? -1 : 1;

    const pipeline: any[] = [
      // 1. Join User Collection to get name and phone
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      // Preserve transactions even if the user document is missing/deleted
      { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
    ];

    // 2. Apply Dynamic Filters (e.g., type="CREDIT", source="VOUCHER")
    if (Object.keys(filters).length > 0) {
      pipeline.push({ $match: filters });
    }

    // 3. Apply Deep Search (Name, Phone, Description)
    if (searchRegex) {
      pipeline.push({
        $match: {
          $or: [
            { "userDoc.firstName": searchRegex },
            { "userDoc.lastName": searchRegex },
            { "userDoc.phoneNumber": searchRegex },
            { description: searchRegex },
            { referenceId: searchRegex },
          ],
        },
      });
    }

    // 4. Pagination and Projection (Formatting the exact output you requested)
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { [sortField]: sortDir } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              name: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ["$userDoc.firstName", "Unknown"] },
                      " ",
                      { $ifNull: ["$userDoc.lastName", ""] },
                    ],
                  },
                },
              },
              phone: { $ifNull: ["$userDoc.phoneNumber", "N/A"] },
              type: 1,
              source: 1,
              amount: 1,
              balance_after: "$balanceAfter",
              description: 1,
              date_time: "$createdAt",
            },
          },
        ],
      },
    });

    const result = await this.model.aggregate(pipeline);
    const totalItems = result[0]?.metadata[0]?.total || 0;

    return {
      items: result[0]?.data || [],
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Calculate total platform earnings
   * Adjust the $match criteria based on how you track platform earnings
   * (e.g., only completed rides, platform commission, etc.)
   */
  async getTotalPlatformEarnings(): Promise<number> {
    const result = await this.model.aggregate([
      {
        $match: {
          // Example: transactionType: "commission", status: "completed"
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Calculates the sum of transaction amounts based on dynamic filters.
   * Defaults to calculating platform earnings via "COMMISSION".
   * * @param filters - MongoDB match criteria to filter transactions
   * @returns Total sum of the matched transactions
   */
  async calculateTotalAmount(
    filters: any = { source: { $in: ["COMMISSION"] } },
  ): Promise<number> {
    const result = await this.model.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }
}
