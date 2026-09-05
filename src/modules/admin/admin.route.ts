import { Router } from "express";
import multer from "multer";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { ActivityService } from "../activity/activity.service";
import { ActivityRepository } from "../activity/activity.repository";
import { AdminRepository } from "./admin.repository";
import { EmailService } from "../../shared/services/email.service";
import { JwtService } from "../../shared/services/jwt.service";
import { createAdminValidation } from "./admin.validators";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdminRole } from "../../middlewares/admin.middleware"; // Assuming you have this middleware
import { authorizeRoles } from "../../middlewares/authorize.middleware";
// import { adminMiddleware } from "../../middlewares/admin.middleware";
import { handleValidationErrors } from "../../middlewares/validation.middleware";

const router = Router();
const upload = multer();

// Dependency Injection
const adminRepository = new AdminRepository();
const activityRepository = new ActivityRepository();
const emailService = new EmailService();
const jwtService = new JwtService();
const adminService = new AdminService(
  adminRepository,
  emailService,
  jwtService,
);
const activityService = new ActivityService(activityRepository);
const adminController = new AdminController(adminService, activityService);

/**
 * Create new admin staff
 * POST /api/v1/admins
 * Protected: Requires authentication and Admin roles
 */
router.post(
  "/",
  upload.none(),
  authenticate,
  // requireAdminRole,
  authorizeRoles("admin"),
  createAdminValidation,
  handleValidationErrors,
  adminController.createAdmin,
);

/**
 * Delete an admin staff
 * DELETE /api/v1/admins/:adminId
 * Protected: Requires authentication and Admin roles
 */
router.delete(
  "/:adminId",
  authenticate,
  // requireAdminRole,
  authorizeRoles("admin"),
  adminController.deleteAdmin,
);

/**
 * Admin Login
 * POST /api/v1/admins/login
 * Public: Used by the Next.js Dashboard to authenticate staff
 */
router.post(
  "/login",
  upload.none(),
  // Add a simple validator here if desired
  adminController.login,
);

/**
 * Get all admin staff (with pagination, filtering, searching)
 * GET /api/v1/admins
 * Protected: Requires authentication and Admin roles
 */
router.get(
  "/",
  authenticate,
  // requireAdminRole,
  authorizeRoles("admin"),
  adminController.getAdmins,
);
router.get(
  "/:adminId",
  authenticate,
  // requireAdminRole,
  authorizeRoles("admin"),
  adminController.getAdminById,
);
/**
 * Admin Forgot Password
 * POST /api/v1/admins/forgot-password
 * Public
 */
router.post("/forgot-password", upload.none(), adminController.forgotPassword);

/**
 * Admin Verify OTP (Step 2)
 * POST /api/v1/admins/verify-otp
 * Public
 */
router.post("/verify-otp", upload.none(), adminController.verifyOtp);

/**
 * Admin Reset Password (Step 3)
 * POST /api/v1/admins/reset-password
 * Public
 */
router.post("/reset-password", upload.none(), adminController.resetPassword);
router.get(
  "/:adminId/activities",
  authenticate,
  // requireAdminRole,
  authorizeRoles("admin"),
  adminController.getAdminActivities,
);
export { router as adminRouter };
