import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";
import { UserRepository } from "./user.repository";
import type {
  CompleteDriverProfileRequest,
  DriverProfileResponse,
  DriverProfileStatusResponse,
  UpdateDriverProfileRequest,
} from "../driver-profile/driver-profile.types";
import type { DriverProfileDocument } from "../driver-profile/driver-profile.schema";

import type {
  AuthUserResponse,
  AuthLocationInput,
  AuthLocationPoint,
  AuthLocationResponse,
  AuthUserView,
} from "../auth/auth.types";
import type { UserDocument } from "../user/user.schema";
import { parseDate } from "../../shared/utilities/date.util";
import { normalizeStringArray } from "../../shared/utilities/upload.util";
import { deleteFile } from "../../shared/utilities/file.util";
import type { UpdateProfileDetails } from "./user.interface";

export class UserService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async getAllUsers(): Promise<AuthUserResponse[]> {
    const users = await this.userRepository.findMany();

    return users.map((user) => this.mapUserToResponse(user));
  }

  async getUserById(userId: string): Promise<AuthUserResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return this.mapUserToResponse(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthUserResponse> {
    const updatedUser = await this.userRepository.changePassword(
      userId,
      currentPassword,
      newPassword,
    );

    if (!updatedUser) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return this.mapUserToResponse(updatedUser);
  }

  async updateMyDetails(
    userId: string,
    updatePayload: UserDocument,
  ): Promise<AuthUserResponse> {
    if (Object.keys(updatePayload).length === 0) {
      throw new AppError(
        "At least one profile field is required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const existingUser: any = await this.userRepository.findById(userId);

    if (!existingUser) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    const updateData: Partial<UserDocument> = {};

    if (updatePayload.firstName) {
      updateData.firstName = updatePayload.firstName.trim();
    }

    if (updatePayload.lastName) {
      updateData.lastName = updatePayload.lastName.trim();
    }

    // if (updatePayload.email) {
    //   updateData.email = this.normalizeEmail(updatePayload.email);
    // }

    // if (updatePayload.phoneNumber) {
    //   updateData.phoneNumber = this.normalizePhoneNumber(
    //     updatePayload.phoneNumber,
    //   );
    // }

    if (updatePayload.gender) {
      updateData.gender = updatePayload.gender;
    }

    if (updatePayload.location) {
      updateData.location = this.normalizeLocation(
        updatePayload.location as any,
      );
      updateData.locationAddress = this.normalizeLocationAddress(
        updatePayload.location as any,
      ) as string;
    }

    if (updatePayload.locationAddress) {
      updateData.locationAddress = updatePayload.locationAddress.trim();
    }

    if (updatePayload.profilePicture && existingUser.profilePicture) {
      deleteFile(existingUser.profilePicture);
    }
    console.log(
      "🚀 updatePayload.profilePicture:",
      updatePayload.profilePicture,
    );

    if (updatePayload.profilePicture) {
      updateData.profilePicture = updatePayload.profilePicture.trim();
    }
    console.log("🚀 updateData.profilePicture:", updateData.profilePicture);
    const updatedUser = await this.userRepository.updateOne(
      { _id: userId },
      updateData,
      { new: true },
    );

    if (!updatedUser) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return this.mapUserToResponse(updatedUser);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.trim().replace(/[\s-]/g, "");
  }

  private normalizeLocation(location: AuthLocationInput): AuthLocationPoint {
    return {
      type: "Point",
      coordinates: [location.lng, location.lat],
    };
  }

  private normalizeLocationAddress(
    location: AuthLocationInput,
  ): string | undefined {
    if (typeof location.address !== "string") {
      return undefined;
    }

    const normalizedAddress = location.address.trim();

    return normalizedAddress.length > 0 ? normalizedAddress : undefined;
  }

  private mapUserToView(user: UserDocument): AuthUserView {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture ?? "",
      fullName: `${user.firstName} ${user.lastName}`,
      phoneNumber: user.phoneNumber,
      email: user.email,
      location: this.mapLocationToResponse(user.location, user.locationAddress),
      gender: user.gender,
      role: user.role,
      isVerified: user.isVerified,
      profileCompleted: user.profileCompleted,
      profileCompletionRequired:
        user.role === "driver" && !user.profileCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapLocationToResponse(
    location: AuthLocationPoint,
    locationAddress?: string,
  ): AuthLocationResponse {
    return {
      lat: location.coordinates[1],
      lng: location.coordinates[0],
      ...(locationAddress ? { address: locationAddress } : {}),
    };
  }

  private mapUserToResponse(user: UserDocument): AuthUserResponse {
    return this.mapUserToView(user);
  }

  private normalizeUpdateRequest(
    request: UpdateDriverProfileRequest,
  ): Partial<UserDocument> {
    const updatePayload: Partial<UserDocument> = {};

    // if (typeof request.dateOfBirth !== "undefined") {
    //   updatePayload.dateOfBirth = parseDate(request.dateOfBirth);
    // }

    if (typeof request.gender !== "undefined") {
      updatePayload.gender = request.gender;
    }

    if (typeof request.profilePicture !== "undefined") {
      updatePayload.profilePicture = request.profilePicture.trim();
    }

    return updatePayload;
  }
}
