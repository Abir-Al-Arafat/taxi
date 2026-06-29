import mongoose, { Schema } from "mongoose";
import type { NotificationSchema } from "./notification.types";

const notificationSchema = new Schema<
  NotificationSchema & { data?: Record<string, unknown> }
>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String },
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    city: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

// Index for fetching unread notifications quickly
notificationSchema.index({ userId: 1, isRead: 1 });

export const NotificationModel = mongoose.model<NotificationSchema>(
  "Notification",
  notificationSchema,
);
