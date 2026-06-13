import { model, Schema, type Document, type Types } from "mongoose";
import type { AuthGender } from "../auth/auth.types";
import type { DriverVehicleType } from "./driver-profile.types";

export interface DriverProfileDocument extends Omit<Document, "model"> {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  dateOfBirth: Date;
  gender: AuthGender;
  nidOrPassport: string;
  drivingLicenseImages: string[];
  vehicleRegistrationDocumentImages: string[];
  vehicleType: DriverVehicleType;
  carCompany: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  profileCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  profilePicture?: string;
}

const driverProfileSchema = new Schema<DriverProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    nidOrPassport: {
      type: String,
      required: true,
      trim: true,
    },
    drivingLicenseImages: {
      type: [String],
      required: true,
      default: [],
    },
    vehicleRegistrationDocumentImages: {
      type: [String],
      required: true,
      default: [],
    },
    vehicleType: {
      type: String,
      required: true,
      enum: ["taxi", "normal car"],
    },
    carCompany: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: 2100,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    plateNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    profileCompleted: {
      type: Boolean,
      default: true,
      index: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

driverProfileSchema.index({ userId: 1 }, { unique: true });

driverProfileSchema.index({ profileCompleted: 1 });

const DriverProfileModel = model<DriverProfileDocument>(
  "DriverProfile",
  driverProfileSchema,
);

export { DriverProfileModel };
