import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { NotificationRepository } from "./notification.repository";
import { EmailService } from "../../shared/services/email.service";
import { requireAdminRole } from "../../middlewares/admin.middleware";
import { UserRepository } from "../user/user.repository";
import { adminNotificationValidation } from "./notification.validators";
import { handleValidationErrors } from "../../middlewares/validation.middleware";

const router = Router();
const upload = multer();

// 1. Initialize dependencies
const notificationRepository = new NotificationRepository();
const emailService = new EmailService();
const userRepository = new UserRepository();

const notificationService = new NotificationService(
  notificationRepository,
  emailService,
  userRepository,
);

const notificationController = new NotificationController(notificationService);

// 2. Protect all notification routes
router.use(authenticate);

// ---------------------------------------------------------
// Admin Endpoints
// ---------------------------------------------------------
// Get all platform notifications (paginated, sortable, filterable)
router.get(
  "/admin/all",
  // authenticate,
  requireAdminRole,
  notificationController.getAllNotifications,
);

router.post(
  "/send",
  // authenticate,
  upload.none(),
  requireAdminRole,
  adminNotificationValidation,
  handleValidationErrors,
  notificationController.sendAdminNotification,
);

// 3. Define endpoints
router.get("/", notificationController.getMyNotifications);

router.patch("/:id/read", notificationController.markAsRead);
export { router as notificationRouter };
