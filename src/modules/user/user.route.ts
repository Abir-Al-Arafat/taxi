import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { UserController } from "./user.controller";
import { uploadUserData } from "./user.middleware";
import { normalizeUserProfilePayload } from "./user.validators";
import { requireAdminRole } from "../../middlewares/admin.middleware";

const router = Router();
const upload = multer();
const userController = new UserController();

// Mount the overview route BEFORE routes like router.get("/:userId", ...)
// Optionally wrap with admin authMiddleware if this is an admin dashboard
router.get("/overview", userController.getUserOverview);

router.get("/", userController.getAllUsers); // Admin-only route, consider adding requireAdminRole middleware

router.get("/me", authenticate, userController.getMyDetails);

router.get("/:id", userController.getUserById);

router.patch(
  "/me",
  authenticate,
  uploadUserData,
  normalizeUserProfilePayload,
  userController.updateMyDetails,
);

router.patch(
  "/me/online-status",
  authenticate,
  userController.toggleOnlineStatus,
);

router.patch(
  "/me/password",
  authenticate,
  upload.none(),
  userController.changePassword,
);

router.patch(
  "/:id/toggle-block",
  authenticate,
  requireAdminRole,
  userController.toggleBlockStatus,
);

export { router as userRouter };
