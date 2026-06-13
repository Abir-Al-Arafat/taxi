import type { NextFunction, Response, Request } from "express"; // 1. Added Request type here explicitly
import path from "path"; // 2. Fixed cross-platform path import semantics
import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AuthRepository } from "../auth/auth.repository";
import {
  createMultiFieldUploadMiddleware,
  FieldConfig,
} from "../../middlewares/upload.middleware";
import { IMAGE_MIME_TYPES } from "../../constants/upload.constants";

// 1. Keep field allocations enclosed in the domain middleware file
const userProfileUploadFields: FieldConfig[] = [
  { name: "nidOrPassport", maxCount: 1, allowedMimeTypes: IMAGE_MIME_TYPES },

  { name: "profilePicture", maxCount: 1, allowedMimeTypes: IMAGE_MIME_TYPES },
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
];

// 2. Clear clean unique file naming utility mapping user context
const customUserFilename = (
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void,
) => {
  const userId = (req as AuthenticatedRequest).user?.userId || "anonymous";
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e4)}`;
  const ext = path.extname(file.originalname);

  cb(null, `${file.fieldname}-${userId}-${uniqueSuffix}${ext}`);
};

// 3. Export the instantiated multipart parse handler directly
export const uploadUserData = createMultiFieldUploadMiddleware(
  userProfileUploadFields,
  "public/uploads/profile-pictures",
  customUserFilename,
);
