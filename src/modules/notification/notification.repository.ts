import { BaseRepository } from "../../repositories/base.repository";
import { NotificationModel } from "./notification.schema";
import type { NotificationSchema } from "./notification.types";

export class NotificationRepository extends BaseRepository<NotificationSchema> {
  constructor() {
    super(NotificationModel);
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationSchema | null> {
    return this.updateOne({ _id: notificationId, userId }, { isRead: true });
  }

  async findNotificationsByUser(
    userId: string,
    limit = 20,
  ): Promise<NotificationSchema[]> {
    return this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec() as Promise<NotificationSchema[]>;
  }
}
