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

const authRepository = new AuthRepository();

export const requireDriverRole = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== "driver") {
    next(
      new AppError(
        "Only drivers can access this resource",
        HTTP_STATUS.FORBIDDEN,
      ),
    );
    return;
  }

  next();
};

export const requireCompletedDriverProfile = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    if (user.role !== "driver") {
      throw new AppError(
        "Only drivers can access this resource",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    if (!user.isVerified) {
      throw new AppError(
        "Driver account must be verified first",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    if (!user.profileCompleted) {
      throw new AppError(
        "Driver profile completion is required before accessing this resource",
        HTTP_STATUS.FORBIDDEN,
      );
    }
    console.log("Driver profile is complete. Proceeding to next middleware.");
    next();
  } catch (error) {
    next(error);
  }
};

// 1. Keep field allocations enclosed in the domain middleware file
const driverProfileUploadFields: FieldConfig[] = [
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
const customDriverFilename = (
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
export const uploadDriverDocuments = createMultiFieldUploadMiddleware(
  driverProfileUploadFields,
  "public/uploads/driver-docs",
  customDriverFilename,
);
