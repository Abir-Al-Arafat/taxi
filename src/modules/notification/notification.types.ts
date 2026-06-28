import { Document, Types } from "mongoose";

export type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "SMS";
export type NotificationType =
  | "SUPPORT_TICKET"
  | "PROMO"
  | "SYSTEM"
  | "RIDE_UPDATE";

export interface SendNotificationRequest {
  userId: string;
  userEmail?: string;
  userPhone?: string;
  title: string;
  body: string;
  type: NotificationType;
  channels: NotificationChannel[];
  data?: Record<string, unknown>; // Flexible payload for deep links/ticket IDs
}

export interface NotificationSchema extends Document {
  _id: Types.ObjectId;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
