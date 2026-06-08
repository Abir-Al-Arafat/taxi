import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdminRole } from "../../middlewares/admin.middleware";
import { DriverApprovalController } from "./driver-approval.controller";

const router = Router();
const upload = multer();
const controller = new DriverApprovalController();

// Both endpoints are protected globally under high security gates
router.use(authenticate, requireAdminRole);

/**
 * GET /api/v1/driver-approval/list
 * Filters available via query criteria: ?profileCompleted=true|false&adminApproved=pending|approved|declined
 */
router.get("/list", controller.getAllDrivers);

/**
 * GET /api/v1/driver-approval/:driverId
 */
router.get("/list/:driverId", controller.getDriverById);

/**
 * POST /api/v1/driver-approval/review/:driverId
 * Payload: { "action": "accept" } or { "action": "decline" }
 */
router.post(
  "/review/:driverId",
  upload.none(),
  controller.handleApprovalAction,
);

export { router as driverApprovalRouter };
