import { model, Schema, type Document, type Types } from "mongoose";
import type {
  AuthGender,
  AuthLocationPoint,
  AuthRole,
} from "../auth/auth.types";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  location: AuthLocationPoint;
  locationAddress?: string;
  gender: AuthGender;
  role: AuthRole;
  passwordHash: string;
  isVerified: boolean;
  verificationTokenHash?: string;
  verificationTokenExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetTokenExpiresAt?: Date;
  passwordResetTokenVerifiedAt?: Date;
  refreshTokenHash?: string;
  refreshTokenExpiresAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  profileCompleted: boolean;
  adminApproved: "pending" | "approved" | "declined";
  profilePicture?: string;
  isBlocked: boolean;
  rideTakenCount: number; // Number of rides taken by the user (for riders)
  rideGivenCount: number; // Number of rides given by the user (for drivers)
  onlineStatus: "online" | "offline"; // Online status of the user (for drivers)
}

const authUserSchema = new Schema<UserDocument>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    locationAddress: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      // required: true,
      enum: ["male", "female", "other"],
    },
    role: {
      type: String,
      required: true,
      enum: ["rider", "driver"],
      default: "rider",
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    profileCompleted: {
      type: Boolean,
      default(this: UserDocument) {
        return this.role !== "driver";
      },
      index: true,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    adminApproved: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    verificationTokenHash: {
      type: String,
      select: false,
    },
    verificationTokenExpiresAt: {
      type: Date,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetTokenExpiresAt: {
      type: Date,
    },
    passwordResetTokenVerifiedAt: {
      type: Date,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    rideTakenCount: {
      type: Number,
      default: 0,
    },
    rideGivenCount: {
      type: Number,
      default: 0,
    },
    onlineStatus: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
  },
  {
    timestamps: true,
  },
);

authUserSchema.index({ verificationTokenHash: 1 });
authUserSchema.index({ passwordResetTokenHash: 1 });
authUserSchema.index({ refreshTokenHash: 1 });
authUserSchema.index({ location: "2dsphere" });

const UserModel = model<UserDocument>("User", authUserSchema);

export { UserModel };
