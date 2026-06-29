import type {
  SendNotificationRequest,
  CreateAdminNotificationRequest,
  NotificationSchema,
} from "./notification.types";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { NotificationRepository } from "./notification.repository";
import { EmailService } from "../../shared/services/email.service";
import { SocketService } from "../../shared/services/socket.service";
import { UserRepository } from "../user/user.repository";
import type {
  IPaginationParams,
  IPaginatedResult,
} from "../../shared/types/pagination.types";
// Future import: import { PushNotificationService } from "../../shared/services/push.service";

export class NotificationService {
  constructor(
    private notificationRepository: NotificationRepository,
    private emailService: EmailService,
    private userRepository: UserRepository,
  ) {}

  async createAndBroadcast(
    payload: CreateAdminNotificationRequest,
  ): Promise<void> {
    // 1. Identify target users based on role
    const filter: any = {};
    if (payload.targetType !== "all") {
      filter.role = payload.targetType;
    }

    console.log("createAndBroadcast payload:", payload);

    const users = await this.userRepository.findMany(filter);

    console.log(`payload ${payload}`);
    console.log(`Target users for notification:`, users);
    try {
      // 2. Persist and Emit for each targeted user
      const notificationPromises = users.map(async (user) => {
        const savedNotification = await this.notificationRepository.create({
          userId: String(user._id),
          title: payload.title,
          body: payload.body,
          type: payload.type,
          data: payload.data || {},
          isRead: false,
        });

        console.log(
          `Notification created for user ${user._id}:`,
          savedNotification,
        );

        // Real-time broadcast
        SocketService.sendToUser(
          String(user._id),
          "newNotification",
          savedNotification,
        );
      });
      console.log("Notification promises created:", notificationPromises);
      const results = await Promise.allSettled(notificationPromises);
      console.log("Notification promises results:", results);
    } catch (error) {
      console.error("Error creating and broadcasting notification:", error);
      throw new AppError("Error creating and broadcasting notification", 500);
    }
  }

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
              "newNotification",
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

  /**
   * Fetches unread notifications for a specific user
   */
  async getMyNotifications(userId: string): Promise<NotificationSchema[]> {
    if (!userId) {
      throw new AppError("User ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Using the repository method we defined earlier
    return this.notificationRepository.findNotificationsByUser(userId, 50);
  }

  /**
   * Marks a specific notification as read, ensuring it belongs to the requesting user
   */
  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationSchema> {
    if (!notificationId) {
      throw new AppError(
        "Notification ID is required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const updatedNotification = await this.notificationRepository.markAsRead(
      notificationId,
      userId,
    );

    if (!updatedNotification) {
      throw new AppError(
        "Notification not found or access denied",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return updatedNotification;
  }

  async getAllNotifications(
    query: any,
  ): Promise<IPaginatedResult<NotificationSchema>> {
    // 1. Extract standard pagination & search parameters
    const paginationParams: IPaginationParams = {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      search: query.search,
    };

    // 2. Build explicit database filters from query parameters
    const filters: Record<string, any> = {};

    if (query.type) {
      filters.type = query.type;
    }

    if (query.isRead !== undefined) {
      filters.isRead = query.isRead === "true";
    }

    if (query.userId) {
      filters.userId = query.userId;
    }

    // 3. Define which fields the ?search= parameter should scan
    const searchableFields = ["title", "body"];

    // 4. Execute the paginated query
    return this.notificationRepository.findPaginated(
      paginationParams,
      filters,
      searchableFields,
    );
  }
}
