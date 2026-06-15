import mongoose from "mongoose";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { BaseRepository } from "../../repositories/base.repository";
import { AuthService } from "../auth/auth.service";
import { UserModel, type UserDocument } from "../user/user.schema";
import type { UpdateProfileDetails } from "./user.interface";

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
}
