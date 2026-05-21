import mongoose from "mongoose";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { BaseRepository } from "../../repositories/base.repository";
import { AuthUserModel, type AuthUserDocument } from "./user.schema";

export class AuthRepository extends BaseRepository<AuthUserDocument> {
  constructor() {
    super(AuthUserModel);
  }

  async createUser(
    payload: Partial<AuthUserDocument>,
  ): Promise<AuthUserDocument> {
    try {
      return (await super.create(payload)) as AuthUserDocument;
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

  findByPhoneNumber(phoneNumber: string) {
    return this.model.findOne({ phoneNumber });
  }

  findByPhoneNumberWithSecrets(phoneNumber: string) {
    return this.model
      .findOne({ phoneNumber })
      .select("+passwordHash +verificationTokenHash +passwordResetTokenHash");
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
