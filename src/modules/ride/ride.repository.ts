// src/modules/ride/ride.repository.ts
import { BaseRepository } from "../../repositories/base.repository";
import { Ride } from "./ride.schema";
import type { IRide } from "./ride.interface";

export class RideRepository extends BaseRepository<IRide> {
  constructor() {
    super(Ride);
  }

  // Finds active ride requests within a specific radius (e.g., 5km)
  async findNearbyRequests(
    longitude: number,
    latitude: number,
    driverId?: string,
    maxDistanceMeters: number = 5000,
  ) {
    return this.model
      .find({
        status: "REQUESTED",
        ...(driverId ? { declinedBy: { $ne: driverId } } : {}), // Exclude rides declined by this driver
        pickup: {
          $near: {
            $geometry: { type: "Point", coordinates: [longitude, latitude] },
            $maxDistance: maxDistanceMeters,
          },
        },
      })
      .populate("riderId", "firstName lastName profileImage rating")
      .exec();
  }

  /**
   * Fetches the formatted earnings table data
   */
  async getEarningsTableData(
    skip: number,
    limit: number,
    search?: string,
  ): Promise<{ items: any[]; totalCount: number }> {
    const pipeline: any[] = [
      { $match: { status: "COMPLETED" } },

      // 1. Join Driver Details FIRST so we can search by them
      {
        $lookup: {
          from: "users",
          localField: "driverId",
          foreignField: "_id",
          as: "driverDetails",
        },
      },
      {
        $unwind: {
          path: "$driverDetails",
          preserveNullAndEmptyArrays: false,
        },
      },
    ];

    // 2. Conditionally apply Search Filter
    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      pipeline.push({
        $match: {
          $or: [
            { "driverDetails.firstName": searchRegex },
            { "driverDetails.lastName": searchRegex },
            { "driverDetails.email": searchRegex },
            { "driverDetails.phoneNumber": searchRegex },
          ],
        },
      });
    }

    // 3. Facet: Split pipeline into count & paginated data
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          // Sort, skip, and limit MUST happen inside the data facet
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },

          // Join Fare Rules
          {
            $lookup: {
              from: "farerules",
              localField: "driverDetails.gender",
              foreignField: "gender",
              as: "fareRuleDetails",
            },
          },
          {
            $unwind: {
              path: "$fareRuleDetails",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Join Wallet Transactions
          {
            $lookup: {
              from: "wallettransactions",
              let: { rideIdStr: { $toString: "$_id" } },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$source", "COMMISSION"] },
                        {
                          $or: [
                            { $eq: ["$referenceId", "$$rideIdStr"] },
                            {
                              $regexMatch: {
                                input: "$description",
                                regex: "$$rideIdStr",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
                { $limit: 1 },
              ],
              as: "commissionTransaction",
            },
          },
          {
            $unwind: {
              path: "$commissionTransaction",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Format output
          {
            $project: {
              _id: 0,
              id: "$_id",
              name: {
                $concat: [
                  "$driverDetails.firstName",
                  " ",
                  "$driverDetails.lastName",
                ],
              },
              email: "$driverDetails.email",
              phoneNumber: "$driverDetails.phoneNumber",
              date: "$createdAt",
              status: "$status",
              amount: "$fareDetails.totalFare",
              commission: {
                $ifNull: ["$fareRuleDetails.commissionPercentage", 0],
              },
              earning: {
                $ifNull: [
                  "$commissionTransaction.amount",
                  {
                    $multiply: [
                      "$fareDetails.totalFare",
                      {
                        $divide: [
                          {
                            $ifNull: [
                              "$fareRuleDetails.commissionPercentage",
                              0,
                            ],
                          },
                          100,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      },
    });

    const result = await this.model.aggregate(pipeline).exec();

    // Extract items and total count from the facet result
    return {
      items: result[0]?.data || [],
      totalCount: result[0]?.metadata[0]?.total || 0,
    };
  }

  /**
   * Fetches aggregated stats for the Reports & Analytics dashboard
   */
  async getRideAnalyticsStats() {
    const pipeline: any[] = [
      {
        $facet: {
          totalRides: [{ $count: "count" }],
          cancelledRides: [
            { $match: { status: "CANCELLED" } },
            { $count: "count" },
          ],
          completedStats: [
            { $match: { status: "COMPLETED" } },
            {
              $group: {
                _id: null,
                totalFare: { $sum: "$fareDetails.totalFare" },
                completedCount: { $sum: 1 },
              },
            },
          ],
        },
      },
    ];

    const result = await this.model.aggregate(pipeline).exec();
    const data = result[0];

    return {
      totalRides: data.totalRides[0]?.count || 0,
      cancelledRides: data.cancelledRides[0]?.count || 0,
      completedRides: data.completedStats[0]?.completedCount || 0,
      totalRevenue: data.completedStats[0]?.totalFare || 0, // Total Gross Booking Value
    };
  }
}
