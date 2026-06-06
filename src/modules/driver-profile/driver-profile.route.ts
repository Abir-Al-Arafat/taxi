import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { DriverProfileController } from "./driver-profile.controller";
import {
  completeDriverProfileValidation,
  handleValidationErrors,
  normalizeDriverProfilePayload,
  updateDriverProfileValidation,
} from "./driver-profile.validators";
import {
  requireCompletedDriverProfile,
  requireDriverRole,
} from "./driver-profile.middleware";

const router = Router();
const upload = multer();
const driverProfileController = new DriverProfileController();

router.get(
  "/status",
  authenticate,
  requireDriverRole,
  driverProfileController.getStatus,
);

router.get(
  "/me",
  authenticate,
  requireDriverRole,
  requireCompletedDriverProfile,
  driverProfileController.getMyProfile,
);

router.post(
  "/complete",
  authenticate,
  requireDriverRole,
  upload.none(),
  normalizeDriverProfilePayload,
  completeDriverProfileValidation,
  handleValidationErrors,
  driverProfileController.completeProfile,
);

router.patch(
  "/me",
  authenticate,
  requireDriverRole,
  requireCompletedDriverProfile,
  upload.none(),
  normalizeDriverProfilePayload,
  updateDriverProfileValidation,
  handleValidationErrors,
  driverProfileController.updateMyProfile,
);

export { router as driverProfileRouter };
