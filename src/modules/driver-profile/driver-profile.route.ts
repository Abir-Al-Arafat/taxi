import { Router } from "express";
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
  uploadDriverDocuments,
} from "./driver-profile.middleware";
import {
  driverProfileUploadsDirectory,
  ensureDirectoryExists,
} from "../../shared/utilities/file.util";

const router = Router();
ensureDirectoryExists(driverProfileUploadsDirectory);

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
  uploadDriverDocuments,
  // driverProfileUploadFields,
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
  uploadDriverDocuments,
  // driverProfileUploadFields,
  normalizeDriverProfilePayload,
  updateDriverProfileValidation,
  handleValidationErrors,
  driverProfileController.updateMyProfile,
);

export { router as driverProfileRouter };
