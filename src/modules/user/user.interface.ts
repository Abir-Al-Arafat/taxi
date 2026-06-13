import type { Gender } from "./user.types";
import type { DriverVehicleType } from "../driver-profile/driver-profile.types";
import { AuthLocationInput } from "../auth/auth.types";

export interface UpdateProfileDetails {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  location?: AuthLocationInput;
  dateOfBirth?: string;
  gender?: Gender;
  nidOrPassport?: string;
  profileImage?: string;
  drivingLicenseImages?: string[];
  vehicleRegistrationDocumentImages?: string[];
  vehicleType?: DriverVehicleType;
  carCompany?: string;
  model?: string;
  year?: number;
  color?: string;
  plateNumber?: string;
}
