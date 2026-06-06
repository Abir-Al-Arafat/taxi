import mongoose from "mongoose";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";
import { BaseRepository } from "../../repositories/base.repository";
import {
  DriverProfileModel,
  type DriverProfileDocument,
} from "./driver-profile.schema";

export class DriverProfileRepository extends BaseRepository<DriverProfileDocument> {
  constructor() {
    super(DriverProfileModel);
  }

  findByUserId(userId: string) {
    return this.model.findOne({ userId });
  }

  async upsertProfileByUserId(
    userId: string,
    payload: Partial<DriverProfileDocument>,
    session?: mongoose.ClientSession,
  ): Promise<DriverProfileDocument | null> {
    try {
      return this.model.findOneAndUpdate(
        { userId },
        {
          $set: {
            ...payload,
            userId,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
          session,
        },
      );
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async updateProfileByUserId(
    userId: string,
    payload: Partial<DriverProfileDocument>,
    session?: mongoose.ClientSession,
  ): Promise<DriverProfileDocument | null> {
    try {
      return this.model.findOneAndUpdate(
        { userId },
        {
          $set: {
            ...payload,
          },
        },
        {
          new: true,
          runValidators: true,
          session,
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
