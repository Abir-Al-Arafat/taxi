import type {
  SendNotificationRequest,
  NotificationSchema,
} from "./notification.types";
import { AppError } from "../../core/errors/AppError";
import { NotificationRepository } from "./notification.repository";
import { EmailService } from "../../shared/services/email.service";
import { SocketService } from "../../shared/services/socket.service";

// Future import: import { PushNotificationService } from "../../shared/services/push.service";

export class NotificationService {
  constructor(
    private notificationRepository: NotificationRepository,
    private emailService: EmailService,
  ) {}

  /**
   * Dynamically dispatches a notification across specified channels
   */
  async send(payload: SendNotificationRequest): Promise<void> {
    try {
      console.log("Notification payload:", payload);
      const dispatchPromises: Promise<any>[] = [];

      // 1. Handle IN_APP & Real-time Socket Emits
      if (payload.channels.includes("IN_APP")) {
        const dbPromise = this.notificationRepository
          .create({
            userId: payload.userId,
            title: payload.title,
            body: payload.body,
            type: payload.type,
            data: payload.data || {},
            isRead: false,
          })
          .then((savedNotification) => {
            // FIX: Use the static method sendToUser directly on the class
            SocketService.sendToUser(
              payload.userId,
              "NEW_NOTIFICATION",
              savedNotification,
            );
          });

        dispatchPromises.push(dbPromise);
      }

      // 2. Handle EMAIL Dispatch
      if (payload.channels.includes("EMAIL")) {
        if (!payload.userEmail) {
          throw new AppError(
            "Email channel requested but userEmail is missing",
            400,
          );
        }

        const emailPromise = this.emailService.sendEmail({
          to: payload.userEmail,
          subject: payload.title,
          text: payload.body,
          // Use templating mapped to NotificationType here if needed
        });
        dispatchPromises.push(emailPromise);
      }

      // 3. Handle PUSH Dispatch (Mobile)
      if (payload.channels.includes("PUSH")) {
        // TODO: Implement Firebase/APNs Push dispatch here when push.service is ready
        // const pushPromise = this.pushService.sendToDevice(payload.userId, payload.title, payload.body);
        // dispatchPromises.push(pushPromise);
      }

      // Execute all channel dispatches in parallel
      await Promise.allSettled(dispatchPromises);
    } catch (error) {
      // Catch and wrap unexpected routing failures without crashing main flows
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to dispatch notifications", 500);
    }
  }
}
