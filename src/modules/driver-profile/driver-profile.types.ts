import type { AuthGender } from "../auth/auth.types";

export type DriverVehicleType = "taxi" | "normal car";

export interface CompleteDriverProfileRequest {
  dateOfBirth: string;
  gender: AuthGender;
  nidOrPassport: string;
  profilePicture: string;
  drivingLicenseImages: string[];
  vehicleRegistrationDocumentImages: string[];
  vehicleType: DriverVehicleType;
  carCompany: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
}

export interface UpdateDriverProfileRequest {
  dateOfBirth?: string;
  gender?: AuthGender;
  nidOrPassport?: string;
  profilePicture?: string;
  drivingLicenseImages?: string[];
  vehicleRegistrationDocumentImages?: string[];
  vehicleType?: DriverVehicleType;
  carCompany?: string;
  model?: string;
  year?: number;
  color?: string;
  plateNumber?: string;
}

export interface DriverProfileResponse {
  id: string;
  userId: string;
  dateOfBirth: Date;
  gender: AuthGender;
  nidOrPassport: string;
  profilePicture: string;
  drivingLicenseImages: string[];
  vehicleRegistrationDocumentImages: string[];
  vehicleType: DriverVehicleType;
  carCompany: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  profileCompleted: boolean;
  completedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverProfileStatusResponse {
  profile: DriverProfileResponse | null;
  profileCompleted: boolean;
  profileCompletionRequired: boolean;
  profilePicture?: string;
}
