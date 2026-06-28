import { Router } from "express";
import multer from "multer";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";
import { SupportRepository } from "./support.repository";
import { NotificationService } from "../notification/notification.service";
import { NotificationRepository } from "../notification/notification.repository";
import { UserRepository } from "../user/user.repository";
import { EmailService } from "../../shared/services/email.service";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const upload = multer();

// 1. Initialize Notification Module Dependencies
const notificationRepository = new NotificationRepository();
const emailService = new EmailService();
const notificationService = new NotificationService(
  notificationRepository,
  emailService,
);

// 2. Initialize Support Module Dependencies
const supportRepository = new SupportRepository();
const userRepository = new UserRepository();
// 3. CRITICAL: Pass the notificationService into SupportService here!
const supportService = new SupportService(
  supportRepository,
  notificationService,
  userRepository,
);

// 4. Pass the configured service to the controller
const supportController = new SupportController(supportService);

/**
 * @route POST /api/v1/support
 * @desc User creates a ticket
 */
router.post("/", upload.none(), authenticate, supportController.createTicket);

/**
 * @route GET /api/v1/support
 * @desc Admin fetches paginated tickets
 */
router.get("/", supportController.getTickets);

/**
 * @route GET /api/v1/support/metrics
 * @desc Admin dashboard metrics
 */
router.get("/metrics", supportController.getMetrics);

/**
 * @route GET /api/v1/support/users/:userId
 * @desc Fetch past tickets of a single user
 */
router.get("/users/:userId", supportController.getUserTickets);

/**
 * @route GET /api/v1/support/:id
 * @desc Fetch single ticket details
 */
router.get("/:id", supportController.getTicketById);

/**
 * @route PUT /api/v1/support/:id/status
 * @desc Admin updates ticket status/resolution
 */
router.put("/:id/status", supportController.updateTicket);

/**
 * @route POST /api/v1/support/:id/reply
 * @desc Send direct reply/notification to user
 */
router.post("/:id/reply", upload.none(), supportController.replyToTicket);

export { router as supportRouter };
