import mongoose from "mongoose";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { BaseRepository } from "../../repositories/base.repository";
import { UserModel, type UserDocument } from "../user/user.schema";
import type { UpdateProfileDetails } from "./user.interface";

export class UserRepository extends BaseRepository<UserDocument> {
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
