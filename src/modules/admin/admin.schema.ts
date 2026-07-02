import { Schema, model } from "mongoose";
import type { AdminSchema } from "./admin.types";

export const ALL_SECTIONS = [
  "Dashboard",
  "Riders",
  "Drivers",
  "Ride Management",
  "Earning",
  "Fare management",
  "Voucher",
  "Promo code",
  "Notification Management",
  "Help & Support",
];

const adminSchema = new Schema<AdminSchema>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    role: {
      type: String,
      required: true,
      default: "operation staff",
      trim: true,
    },
    sections: [{ type: String, enum: ALL_SECTIONS }],
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const AdminModel = model<AdminSchema>("Admin", adminSchema);
