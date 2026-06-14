import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { AppError } from "../core/errors/AppError";
import {
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_FILES,
  DEFAULT_UPLOAD_DIR,
  IMAGE_MIME_TYPES,
} from "../constants/upload.constants";
import type {
  UploadOptions,
  UploadRequest,
} from "../shared/types/upload.types";
import {
  validateFileCount,
  validateFileSize,
  validateMimeType,
} from "../shared/validators/upload.validator";
import HTTP_STATUS from "../constants/statusCodes";

/**
 * Configuration for a single field in multi-field upload
 */
export interface FieldConfig {
  /** Field name in the multipart form data */
  name: string;
  /** Maximum number of files for this field (default: 1) */
  maxCount?: number;
  /** Maximum file size in bytes for this field (optional) */
  maxFileSize?: number;
  /** Allowed MIME types for this field (optional) */
  allowedMimeTypes?: readonly string[];
}

/**
 * Creates a file upload middleware factory function
 * @param options - Upload configuration options
 * @returns Express middleware function for handling file uploads
 */
export const createUploadMiddleware = (options: UploadOptions) => {
  const {
    fieldName,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes = [],
    uploadDir = DEFAULT_UPLOAD_DIR,
    multiple = false,
    maxFiles = DEFAULT_MAX_FILES,
    filename,
  } = options;

  // Ensure upload directory exists
  const absoluteUploadDir = path.resolve(uploadDir);
  if (!fs.existsSync(absoluteUploadDir)) {
    fs.mkdirSync(absoluteUploadDir, { recursive: true });
  }

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, absoluteUploadDir);
    },
    filename: filename
      ? filename
      : (_req, file, cb) => {
          // Generate unique filename: timestamp + random string + extension
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = path.extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
  });

  // Configure multer
  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: multiple ? maxFiles : 1,
    },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback,
    ) => {
      try {
        // Validate MIME type if restrictions are set
        if (allowedMimeTypes.length > 0) {
          validateMimeType(file.mimetype, allowedMimeTypes);
        }
        cb(null, true);
      } catch (error) {
        if (error instanceof AppError) {
          cb(error);
        } else {
          cb(new AppError("File validation failed", HTTP_STATUS.BAD_REQUEST));
        }
      }
    },
  });

  // Return appropriate multer middleware based on configuration
  if (multiple) {
    return upload.array(fieldName, maxFiles);
  }
  return upload.single(fieldName);
};

/**
 * Pre-configured middleware for single image upload
 * Default: 5MB max, common image types only
 */
export const uploadSingleImage = (fieldName: string = "image") =>
  createUploadMiddleware({
    fieldName,
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes: [...IMAGE_MIME_TYPES],
    multiple: false,
  });

/**
 * Pre-configured middleware for multiple image upload
 * Default: 5MB max per file, 5 files max, common image types only
 */
export const uploadMultipleImages = (
  fieldName: string = "images",
  maxFiles: number = DEFAULT_MAX_FILES,
) =>
  createUploadMiddleware({
    fieldName,
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes: [...IMAGE_MIME_TYPES],
    multiple: true,
    maxFiles,
  });

/**
 * Pre-configured middleware for single document upload
 * Default: 10MB max, common document types only
 */
export const uploadSingleDocument = (fieldName: string = "document") =>
  createUploadMiddleware({
    fieldName,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    multiple: false,
  });

/**
 * Middleware to validate uploaded file(s) after upload
 * Use this after the upload middleware to add custom validation
 */
export const validateUploadedFile =
  (options: { required?: boolean; maxFileSize?: number } = {}) =>
  (req: UploadRequest, _res: Response, next: NextFunction): void => {
    const { required = true, maxFileSize } = options;

    try {
      if (req.file) {
        // Single file upload
        if (maxFileSize) {
          validateFileSize(req.file.size, maxFileSize);
        }
      } else if (req.files && req.files.length > 0) {
        // Multiple file upload
        if (maxFileSize) {
          req.files.forEach((file) => {
            validateFileSize(file.size, maxFileSize);
          });
        }
      } else if (required) {
        throw new AppError("File upload is required", HTTP_STATUS.BAD_REQUEST);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(
          new AppError(
            "File validation failed",
            HTTP_STATUS.UNPROCESSABLE_ENTITY,
          ),
        );
      }
    }
  };

/**
 * Creates a multi-field upload middleware
 * Similar to multer.fields() but with validation and type safety
 * @param fields - Array of field configurations
 * @param uploadDir - Upload directory path (default: DEFAULT_UPLOAD_DIR)
 * @param filename - Custom filename function (optional)
 * @returns Express middleware function for handling multi-field file uploads
 */
export const createMultiFieldUploadMiddleware = (
  fields: FieldConfig[],
  defaultUploadDir: string, // fallback folder
  filenameCustomizer?: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => void,
) => {
  const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
      // 1. Check if the incoming file field is the profile picture
      let targetDir = defaultUploadDir;
      if (
        file.fieldname === "profileImage" ||
        file.fieldname === "profilePicture"
      ) {
        targetDir = "public/uploads/profile-pictures";
      }

      // 2. Ensure the specific target folder exists on disk dynamically
      const absoluteUploadDir = path.resolve(targetDir);
      if (!fs.existsSync(absoluteUploadDir)) {
        fs.mkdirSync(absoluteUploadDir, { recursive: true });
      }

      cb(null, absoluteUploadDir);
    },
    filename: (req, file, cb) => {
      if (filenameCustomizer) {
        filenameCustomizer(req, file, cb);
      } else {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(
          null,
          `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
        );
      }
    },
  });

  // Keep filter validation mappings exactly the same
  const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    const config = fields.find((f) => f.name === file.fieldname);
    if (!config) {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
      return;
    }

    if (
      config.allowedMimeTypes &&
      !config.allowedMimeTypes.includes(file.mimetype)
    ) {
      cb(
        new AppError(
          `Invalid file type for field ${file.fieldname}`,
          HTTP_STATUS.BAD_REQUEST,
        ),
      );
      return;
    }

    cb(null, true);
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: Math.max(
        ...fields.map((f) => f.maxFileSize || 5 * 1024 * 1024),
      ),
    },
  });

  return upload.fields(
    fields.map((f) => ({ name: f.name, maxCount: f.maxCount })),
  );
};
