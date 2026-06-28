import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { NotificationRepository } from "./notification.repository";
import { EmailService } from "../../shared/services/email.service";

const router = Router();

// 1. Initialize dependencies
const notificationRepository = new NotificationRepository();
const emailService = new EmailService();
const notificationService = new NotificationService(
  notificationRepository,
  emailService,
);
const notificationController = new NotificationController(notificationService);

// 2. Protect all notification routes
router.use(authenticate);

// 3. Define endpoints
router.get("/", notificationController.getMyNotifications);
router.patch("/:id/read", notificationController.markAsRead);

export { router as notificationRouter };
