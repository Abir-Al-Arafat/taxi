import mongoose from "mongoose";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";
import { AuthRepository } from "../auth/auth.repository";
import type { UserDocument } from "../user/user.schema";
import { DriverProfileRepository } from "./driver-profile.repository";
import type { DriverProfileDocument } from "./driver-profile.schema";
import type {
  CompleteDriverProfileRequest,
  DriverProfileResponse,
  DriverProfileStatusResponse,
  UpdateDriverProfileRequest,
} from "./driver-profile.types";
import { deleteFile } from "../../shared/utilities/file.util";
import { parseDate } from "../../shared/utilities/date.util";
import { normalizeStringArray } from "../../shared/utilities/upload.util";

export class DriverProfileService {
  constructor(
    private readonly driverProfileRepository = new DriverProfileRepository(),
    private readonly authRepository = new AuthRepository(),
  ) {}

  async getStatus(userId: string): Promise<DriverProfileStatusResponse> {
    const user = await this.assertDriverAccount(userId);
    const profile = await this.driverProfileRepository.findByUserId(userId);

    return this.mapProfileStatus(user, profile);
  }

  async getMyProfile(userId: string): Promise<DriverProfileResponse> {
    await this.assertDriverAccount(userId, true);

    const profile = await this.driverProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    return this.mapProfileToResponse(profile);
  }

  async completeProfile(
    userId: string,
    request: CompleteDriverProfileRequest,
  ): Promise<DriverProfileStatusResponse> {
    const user = await this.assertDriverAccount(userId);

    if (user.profileCompleted) {
      throw new AppError(
        "Driver profile is already completed",
        HTTP_STATUS.CONFLICT,
      );
    }
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const profilePayload = this.normalizeCompleteRequest(request);
      const profile = await this.driverProfileRepository.upsertProfileByUserId(
        userId,
        {
          ...profilePayload,
          profileCompleted: true,
          completedAt: new Date(),
        },
        session,
      );

      if (!profile) {
        throw new AppError(
          "Failed to complete driver profile",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      const updatedUser = await this.authRepository.updateOne(
        { _id: userId },
        {
          $set: {
            profileCompleted: true,
          },
        },
        session,
      );

      if (!updatedUser) {
        throw new AppError(
          "Failed to update driver profile status",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      await session.commitTransaction();

      return this.mapProfileStatus(updatedUser, profile);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateMyProfile(
    userId: string,
    request: UpdateDriverProfileRequest,
  ): Promise<DriverProfileStatusResponse> {
    const user = await this.assertDriverAccount(userId, true);
    const existingProfile =
      await this.driverProfileRepository.findByUserId(userId);

    if (!existingProfile) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    const updatePayload = this.normalizeUpdateRequest(request);

    if (Object.keys(updatePayload).length === 0) {
      throw new AppError(
        "At least one profile field is required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    console.log("Update payload after normalization:", updatePayload);

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      if (request.profilePicture && existingProfile.profilePicture) {
        deleteFile(existingProfile.profilePicture);
      }

      if (request.nidOrPassport && existingProfile.nidOrPassport) {
        deleteFile(existingProfile.nidOrPassport);
      }

      // 3. Identify and delete old array files (multi-file uploads)
      if (
        request.drivingLicenseImages &&
        existingProfile.drivingLicenseImages
      ) {
        existingProfile.drivingLicenseImages.forEach((oldImg: string) =>
          deleteFile(oldImg),
        );
      }

      if (
        request.vehicleRegistrationDocumentImages &&
        existingProfile.vehicleRegistrationDocumentImages
      ) {
        existingProfile.vehicleRegistrationDocumentImages.forEach(
          (oldImg: string) => deleteFile(oldImg),
        );
      }

      const profile = await this.driverProfileRepository.updateProfileByUserId(
        userId,
        updatePayload,
        session,
      );

      if (!profile) {
        throw new AppError(
          "Failed to update driver profile",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      if (updatePayload.profilePicture) {
        await this.authRepository.updateOne(
          { _id: userId },
          {
            $set: {
              profilePicture: updatePayload.profilePicture,
            },
          },
          session,
        );
      }

      await session.commitTransaction();

      return this.mapProfileStatus(user, profile);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async assertDriverAccount(
    userId: string,
    requireCompletedProfile = false,
  ): Promise<UserDocument> {
    const user = await this.authRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    if (user.role !== "driver") {
      throw new AppError(
        "Only drivers can access this resource",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    if (!user.isVerified) {
      throw new AppError(
        "Driver account must be verified first",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    if (requireCompletedProfile && !user.profileCompleted) {
      throw new AppError(
        "Driver profile completion is required before accessing this resource",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    return user;
  }

  private normalizeCompleteRequest(
    request: CompleteDriverProfileRequest,
  ): Partial<DriverProfileDocument> {
    return {
      dateOfBirth: parseDate(request.dateOfBirth),
      gender: request.gender,
      nidOrPassport: this.normalizeRequiredString(
        request.nidOrPassport,
        "NID/passport is required",
      ),
      profilePicture: this.normalizeRequiredString(
        request.profilePicture,
        "Profile image is required",
      ),
      drivingLicenseImages: normalizeStringArray(request.drivingLicenseImages),
      vehicleRegistrationDocumentImages: normalizeStringArray(
        request.vehicleRegistrationDocumentImages,
      ),
      vehicleType: request.vehicleType,
      carCompany: this.normalizeRequiredString(
        request.carCompany,
        "Car company is required",
      ),
      model: this.normalizeRequiredString(
        request.model,
        "Vehicle model is required",
      ),
      year: request.year,
      color: this.normalizeRequiredString(
        request.color,
        "Vehicle color is required",
      ),
      plateNumber: this.normalizeRequiredString(
        request.plateNumber,
        "Plate number is required",
      ).toUpperCase(),
    };
  }

  private normalizeUpdateRequest(
    request: UpdateDriverProfileRequest,
  ): Partial<DriverProfileDocument> {
    const updatePayload: Partial<DriverProfileDocument> = {};
    console.log("normalizeUpdateRequest");
    if (typeof request.dateOfBirth !== "undefined") {
      updatePayload.dateOfBirth = parseDate(request.dateOfBirth);
    }

    if (typeof request.gender !== "undefined") {
      updatePayload.gender = request.gender;
    }

    if (typeof request.nidOrPassport !== "undefined") {
      updatePayload.nidOrPassport = request.nidOrPassport.trim();
    }

    if (typeof request.profilePicture !== "undefined") {
      updatePayload.profilePicture = request.profilePicture.trim();
    }

    if (typeof request.drivingLicenseImages !== "undefined") {
      updatePayload.drivingLicenseImages = normalizeStringArray(
        request.drivingLicenseImages,
      );
    }

    if (typeof request.vehicleRegistrationDocumentImages !== "undefined") {
      updatePayload.vehicleRegistrationDocumentImages = normalizeStringArray(
        request.vehicleRegistrationDocumentImages,
      );
    }

    if (typeof request.vehicleType !== "undefined") {
      updatePayload.vehicleType = request.vehicleType;
    }

    if (typeof request.carCompany !== "undefined") {
      updatePayload.carCompany = request.carCompany.trim();
    }

    if (typeof request.model !== "undefined") {
      updatePayload.model = request.model.trim();
    }

    if (typeof request.year !== "undefined") {
      updatePayload.year = request.year;
    }

    if (typeof request.color !== "undefined") {
      updatePayload.color = request.color.trim();
    }

    if (typeof request.plateNumber !== "undefined") {
      updatePayload.plateNumber = request.plateNumber.trim().toUpperCase();
    }

    return updatePayload;
  }

  private normalizeRequiredString(
    value: string | undefined,
    message: string,
  ): string {
    if (typeof value !== "string") {
      throw new AppError(message, HTTP_STATUS.BAD_REQUEST);
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      throw new AppError(message, HTTP_STATUS.BAD_REQUEST);
    }

    return trimmedValue;
  }

  private mapProfileStatus(
    user: UserDocument,
    profile: DriverProfileDocument | null,
  ): DriverProfileStatusResponse {
    return {
      profile: profile ? this.mapProfileToResponse(profile) : null,
      profileCompleted: user.profileCompleted,
      profileCompletionRequired:
        user.role === "driver" && !user.profileCompleted,
      profilePicture: user.profilePicture as string,
    };
  }

  private mapProfileToResponse(
    profile: DriverProfileDocument,
  ): DriverProfileResponse {
    return {
      id: profile._id.toString(),
      userId: profile.userId.toString(),
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      nidOrPassport: profile.nidOrPassport,
      profilePicture: profile.profilePicture as string,
      drivingLicenseImages: profile.drivingLicenseImages,
      vehicleRegistrationDocumentImages:
        profile.vehicleRegistrationDocumentImages,
      vehicleType: profile.vehicleType,
      carCompany: profile.carCompany,
      model: profile.model,
      year: profile.year,
      color: profile.color,
      plateNumber: profile.plateNumber,
      profileCompleted: profile.profileCompleted,
      completedAt: profile.completedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
