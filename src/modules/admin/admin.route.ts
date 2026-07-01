import { Router } from "express";
import multer from "multer";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminRepository } from "./admin.repository";
import { createAdminValidation } from "./admin.validators";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdminRole } from "../../middlewares/admin.middleware"; // Assuming you have this middleware
// import { adminMiddleware } from "../../middlewares/admin.middleware";
import { handleValidationErrors } from "../../middlewares/validation.middleware";

const router = Router();
const upload = multer();

// Dependency Injection
const adminRepository = new AdminRepository();
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);

/**
 * Create new admin staff
 * POST /api/v1/admins
 * Protected: Requires authentication and Admin roles
 */
router.post(
  "/",
  upload.none(),
  authenticate,
  requireAdminRole, // Optional: if you have a middleware restricting to super-admins
  createAdminValidation,
  handleValidationErrors,
  adminController.createAdmin,
);

export { router as adminRouter };
