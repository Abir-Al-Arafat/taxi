import { Router } from "express";
import path from "path";
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
import {
  createMultiFieldUploadMiddleware,
  type FieldConfig,
} from "../../middlewares/upload.middleware";
import { IMAGE_MIME_TYPES } from "../../constants/upload.constants";

const router = Router();
ensureDirectoryExists(driverProfileUploadsDirectory);

const driverProfileController = new DriverProfileController();

// Custom filename function that sanitizes filenames
const customFilename = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
): void => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const extension = path.extname(file.originalname);
  const safeBaseName = path
    .basename(file.originalname, extension)
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  callback(null, `${safeBaseName}-${uniqueSuffix}${extension}`);
};

// Configure multi-field upload middleware
const driverProfileUploadFields = createMultiFieldUploadMiddleware(
  [
    { name: "nidOrPassport", maxCount: 1, allowedMimeTypes: IMAGE_MIME_TYPES },
    { name: "profileImage", maxCount: 1, allowedMimeTypes: IMAGE_MIME_TYPES },
    {
      name: "drivingLicenseImages",
      maxCount: 10,
      allowedMimeTypes: IMAGE_MIME_TYPES,
    },
    {
      name: "vehicleRegistrationDocumentImages",
      maxCount: 10,
      allowedMimeTypes: IMAGE_MIME_TYPES,
    },
  ],
  driverProfileUploadsDirectory,
  customFilename,
);

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
