import { Document } from "mongoose";

export type TSection =
  | "Dashboard"
  | "Riders"
  | "Drivers"
  | "Ride Management"
  | "Earning"
  | "Fare management"
  | "Voucher"
  | "Promo code"
  | "Notification Management"
  | "Help & Support";

export interface AdminSchema extends Document {
  name: string;
  email: string;
  phone: string;
  role: string;
  sections: TSection[];
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  phone: string;
  role: string;
  sections: TSection[];
}
