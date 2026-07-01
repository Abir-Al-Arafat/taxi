import mongoose from "mongoose";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { BaseRepository } from "../../repositories/base.repository";
import { AuthService } from "../auth/auth.service";
import { UserModel, type UserDocument } from "../user/user.schema";
import type { UpdateProfileDetails } from "./user.interface";
import { AuthRole } from "../auth/auth.types";

export class UserRepository extends BaseRepository<UserDocument> {
  private authService = new AuthService();
  constructor() {
    super(UserModel);
  }

  async createUser(payload: Partial<UserDocument>): Promise<UserDocument> {
    try {
      return (await super.create(payload)) as UserDocument;
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(error.errors)
          .map((validationError) => validationError.message)
          .join(", ");

        throw new AppError(messages, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      }

      if (this.isDuplicateKeyError(error)) {
        const duplicateField = Object.keys(error.keyPattern)[0] ?? "field";
        throw new AppError(
          `${duplicateField} already exists`,
          HTTP_STATUS.CONFLICT,
        );
      }

      throw error;
    }
  }

  async updateProfileByUserId(
    userId: string,
    payload: Partial<UpdateProfileDetails>,
    session?: mongoose.ClientSession,
  ): Promise<UpdateProfileDetails | null> {
    try {
      const updateQuery = this.model.updateOne(
        { userId },
        {
          $set: {
            ...payload,
          },
        },
        {
          runValidators: true,
        },
      );

      if (session) {
        updateQuery.session(session);
      }

      await updateQuery;

      const findQuery: any = this.model.findOne({ userId });

      if (session) {
        findQuery.session(session);
      }

      return findQuery;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findByIdWithDriverProfile(userId: string): Promise<any | null> {
    const result = await this.model.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "driverprofiles", // this should match MongoDB collection name (usually lowercase plural)
          localField: "_id",
          foreignField: "userId",
          as: "driverProfile",
        },
      },
      {
        $unwind: {
          path: "$driverProfile",
          preserveNullAndEmptyArrays: true, // Returns the user even if they don't have a driver profile yet
        },
      },
      {
        $project: {
          passwordHash: 0, // Exclude sensitive fields from the aggregation result
          verificationTokenHash: 0,
          passwordResetTokenHash: 0,
          "driverProfile.__v": 0,
        },
      },
    ]);

    return result[0] || null;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    session?: mongoose.ClientSession,
  ): Promise<UserDocument | null> {
    try {
      const user = await this.model
        .findOne({ _id: userId })
        .select("+passwordHash");

      if (!user) {
        throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
      }

      if (!user.passwordHash) {
        throw new AppError(
          "User does not have a password set",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      console.log(`user.passwordHash: ${user.passwordHash}`);
      console.log(
        `this.authService.hashPassword(currentPassword): ${this.authService.hashPassword(currentPassword)}`,
      );

      if (
        !this.authService.verifyPassword(currentPassword, user.passwordHash)
      ) {
        throw new AppError(
          "Current password is incorrect",
          HTTP_STATUS.UNAUTHORIZED,
        );
      }
      const updateQuery = this.model.updateOne(
        { _id: userId },
        {
          $set: {
            passwordHash: this.authService.hashPassword(newPassword),
          },
        },
        {
          runValidators: true,
        },
      );

      if (session) {
        updateQuery.session(session);
      }

      await updateQuery;

      const findQuery = this.model.findOne({ _id: userId });

      if (session) {
        findQuery.session(session);
      }

      return findQuery;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async toggleBlockStatus(userId: string): Promise<UserDocument | null> {
    try {
      return await this.model.findOneAndUpdate(
        { _id: userId },
        [
          {
            $set: {
              isBlocked: { $not: { $ifNull: ["$isBlocked", false] } },
            },
          },
        ],
        {
          new: true,
          updatePipeline: true,
        },
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async toggleOnlineStatus(userId: string): Promise<UserDocument | null> {
    try {
      return await this.model.findOneAndUpdate(
        { _id: userId },
        [
          {
            $set: {
              onlineStatus: {
                $cond: {
                  if: { $eq: ["$onlineStatus", "online"] },
                  then: "offline",
                  else: "online",
                },
              },
            },
          },
        ],
        {
          new: true,
          updatePipeline: true,
        },
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors)
        .map((validationError) => validationError.message)
        .join(", ");

      throw new AppError(messages, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    if (this.isDuplicateKeyError(error)) {
      const duplicateField = Object.keys(error.keyPattern)[0] ?? "field";
      throw new AppError(
        `${duplicateField} already exists`,
        HTTP_STATUS.CONFLICT,
      );
    }

    throw error;
  }

  findByPhoneNumber(phoneNumber: string) {
    return this.model.findOne({ phoneNumber });
  }

  findById(userId: string) {
    return this.model.findById(userId);
  }

  findByPhoneNumberWithSecrets(phoneNumber: string) {
    return this.model
      .findOne({ phoneNumber })
      .select(
        "+passwordHash +verificationTokenHash +passwordResetTokenHash +passwordResetTokenVerifiedAt",
      );
  }

  findByEmail(email: string) {
    return this.model.findOne({ email });
  }

  findByEmailOrPhoneNumber(email: string, phoneNumber: string) {
    return this.model.findOne({ $or: [{ email }, { phoneNumber }] });
  }

  saveRefreshToken(userId: string, refreshTokenHash: string, expiresAt: Date) {
    return this.updateOne(
      { _id: userId },
      { refreshTokenHash, refreshTokenExpiresAt: expiresAt },
    );
  }

  findByIdWithRefreshSecret(userId: string) {
    return this.model
      .findById(userId)
      .select("+refreshTokenHash +refreshTokenExpiresAt");
  }

  clearRefreshToken(userId: string) {
    return this.updateOne(
      { _id: userId },
      {
        $unset: {
          refreshTokenHash: "",
          refreshTokenExpiresAt: "",
        },
      },
    );
  }

  private isDuplicateKeyError(
    error: unknown,
  ): error is { code: number; keyPattern: Record<string, unknown> } {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === 11000 &&
      "keyPattern" in error &&
      typeof (error as { keyPattern?: unknown }).keyPattern === "object"
    );
  }

  /**
   * Aggregate users by month for a specific year and role
   */
  async getUserStatsByYearAndRole(year: number, role: AuthRole) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    return await this.model.aggregate([
      {
        $match: {
          role: role,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
  }

  async getPaginatedUsers(options: {
    page: number;
    limit: number;
    includeVehicleType: boolean;
  }) {
    console.log(
      "🚀 ~ file: user.repository.ts:333 ~ UserRepository ~ getPaginatedUsers ~ options:",
      options,
    );
    const { page, limit, includeVehicleType } = options;
    const skip = (page - 1) * limit;

    // 1. Start building the aggregation pipeline
    const pipeline: any[] = [];
    console.log("includeVehicleType", includeVehicleType);
    // 2. Conditionally add the $lookup to join DriverProfile
    if (includeVehicleType) {
      pipeline.push(
        {
          $lookup: {
            from: "driverprofiles", // Verify this matches your actual MongoDB collection name (usually lowercase + plural)
            localField: "_id",
            foreignField: "userId", // The field in DriverProfile schema that references the User
            as: "driverProfileData",
          },
        },
        {
          // $unwind flattens the array. preserveNullAndEmptyArrays ensures riders (who don't have a profile) aren't filtered out
          $unwind: {
            path: "$driverProfileData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          // Add the vehicleType to the root document for a cleaner response
          $addFields: {
            vehicleType: "$driverProfileData.vehicleType",
          },
        },
        {
          // Remove the raw joined object to keep the payload clean
          $project: {
            driverProfileData: 0,
          },
        },
      );
    }

    // 3. Add pagination stages
    pipeline.push({ $skip: skip }, { $limit: limit });

    // 4. Execute queries in parallel (one for data, one for total count)
    const [items, totalCount] = await Promise.all([
      this.model.aggregate(pipeline),
      this.model.countDocuments(),
    ]);

    // Format the response to match your existing structure
    return {
      items,
      meta: {
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Fetches paginated driver top-up and earnings report
   */
  async getDriverTopUpReportData(skip: number, limit: number, search?: string) {
    const matchStage: any = { role: "driver" };

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      matchStage.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phoneNumber: searchRegex },
      ];
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

            // 1. Join Wallet Collection
            {
              $lookup: {
                from: "wallets", // Ensure this matches your MongoDB collection name
                localField: "_id",
                foreignField: "userId",
                as: "wallet",
              },
            },
            { $unwind: { path: "$wallet", preserveNullAndEmptyArrays: true } },

            // 2. Join Wallet Transactions (Top-ups / Credits)
            {
              $lookup: {
                from: "wallettransactions",
                let: { driverId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$userId", "$$driverId"] },
                          { $eq: ["$type", "CREDIT"] },
                          // You can add { $eq: ["$source", "TOP_UP"] } if you strictly separate top-ups from other credits
                        ],
                      },
                    },
                  },
                  { $sort: { createdAt: -1 } }, // Sort newest first to get "lastTopUp"
                ],
                as: "credits",
              },
            },

            // 3. Join Rides for Total Rides and Total Earnings
            {
              $lookup: {
                from: "rides",
                let: { driverId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$driverId", "$$driverId"] },
                      status: "COMPLETED",
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      totalRides: { $sum: 1 },
                      totalEarnings: { $sum: "$fareDetails.totalFare" }, // Summing total driver earnings
                    },
                  },
                ],
                as: "rideStats",
              },
            },

            // 4. Project Final Flat Object for the Frontend
            {
              $project: {
                _id: 0,
                id: "$_id",
                driverName: { $concat: ["$firstName", " ", "$lastName"] },
                phoneNumber: "$phoneNumber",
                walletBalance: { $ifNull: ["$wallet.balance", 0] },
                totalTopUp: { $sum: "$credits.amount" },
                lastTopUp: {
                  $let: {
                    vars: { firstCredit: { $arrayElemAt: ["$credits", 0] } },
                    in: { $ifNull: ["$$firstCredit.amount", 0] },
                  },
                },
                totalRides: {
                  $let: {
                    vars: { stat: { $arrayElemAt: ["$rideStats", 0] } },
                    in: { $ifNull: ["$$stat.totalRides", 0] },
                  },
                },
                totalEarnings: {
                  $let: {
                    vars: { stat: { $arrayElemAt: ["$rideStats", 0] } },
                    in: { $ifNull: ["$$stat.totalEarnings", 0] },
                  },
                },
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
