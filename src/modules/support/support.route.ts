import { Router } from "express";
import multer from "multer";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const upload = multer();

// DI Container
const supportService = new SupportService();
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
router.post("/:id/reply", supportController.replyToTicket);

export { router as supportRouter };
