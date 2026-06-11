import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";
import { UserRepository } from "./user.repository";

import type {
  AuthUserResponse,
  AuthLocationInput,
  AuthLocationPoint,
  AuthLocationResponse,
  AuthUserView,
} from "../auth/auth.types";
import type { UserDocument } from "../user/user.schema";

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
}
