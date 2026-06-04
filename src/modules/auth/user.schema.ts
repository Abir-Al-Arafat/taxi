import { model, Schema, type Document, type Types } from "mongoose";
import type { AuthGender, AuthLocationPoint, AuthRole } from "./auth.types";

export interface AuthUserDocument extends Document {
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
}

const authUserSchema = new Schema<AuthUserDocument>(
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
      required: true,
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
  },
  {
    timestamps: true,
  },
);

authUserSchema.index({ verificationTokenHash: 1 });
authUserSchema.index({ passwordResetTokenHash: 1 });
authUserSchema.index({ refreshTokenHash: 1 });
authUserSchema.index({ location: "2dsphere" });

const AuthUserModel = model<AuthUserDocument>("User", authUserSchema);

export { AuthUserModel };
