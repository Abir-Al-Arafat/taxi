// src/modules/driver-approval/driver-approval.repository.ts
import { BaseRepository } from "../../repositories/base.repository";
import { UserModel, UserDocument } from "../auth/user.schema";

export class DriverApprovalRepository extends BaseRepository<UserDocument> {
  constructor() {
    super(UserModel);
  }

  /**
   * High-performance aggregation lookup stiching user metadata along with physical profile files
   * leveraging the matching { role: 1, profileCompleted: 1, adminApproved: 1 } compound index layer.
   */
  async findDriversWithProfiles(filter: {
    profileCompleted?: boolean;
    adminApproved?: string;
  }) {
    const matchStage: any = { role: "driver" };

    if (filter.profileCompleted !== undefined) {
      matchStage.profileCompleted = filter.profileCompleted;
    }
    if (filter.adminApproved !== undefined) {
      matchStage.adminApproved = filter.adminApproved;
    }

    return UserModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "driverprofiles", // collections are lowercased plurals by convention in Mongoose
          localField: "_id",
          foreignField: "userId",
          as: "profile",
        },
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true, // Retain drivers who completed OTP but not files yet
        },
      },
      {
        $project: {
          password: 0,
          refreshToken: 0,
          __v: 0,
          "profile.__v": 0,
        },
      },
    ]);
  }
}
