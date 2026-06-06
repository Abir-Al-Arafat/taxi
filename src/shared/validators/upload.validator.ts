import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";

/**
 * Validates file MIME type against allowed types
 * @param fileMimeType - MIME type of the uploaded file
 * @param allowedMimeTypes - Array of allowed MIME types
 * @throws AppError if MIME type is not allowed
 */
export const validateMimeType = (
  fileMimeType: string,
  allowedMimeTypes: readonly string[],
): void => {
  if (!allowedMimeTypes || allowedMimeTypes.length === 0) {
    return; // No restriction if no allowed types specified
  }

  const isAllowed = allowedMimeTypes.includes(fileMimeType);
  if (!isAllowed) {
    throw new AppError(
      `File type ${fileMimeType} is not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }
};

/**
 * Validates file size against maximum limit
 * @param fileSize - Size of the uploaded file in bytes
 * @param maxFileSize - Maximum allowed file size in bytes
 * @throws AppError if file size exceeds limit
 */
export const validateFileSize = (
  fileSize: number,
  maxFileSize: number,
): void => {
  if (fileSize > maxFileSize) {
    const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    throw new AppError(
      `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
      HTTP_STATUS.REQUEST_ENTITY_TOO_LARGE,
    );
  }
};

/**
 * Validates number of files against maximum limit
 * @param fileCount - Number of files uploaded
 * @param maxFiles - Maximum allowed number of files
 * @throws AppError if file count exceeds limit
 */
export const validateFileCount = (
  fileCount: number,
  maxFiles: number,
): void => {
  if (fileCount > maxFiles) {
    throw new AppError(
      `Maximum ${maxFiles} files allowed. Received ${fileCount} files.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
};

/**
 * Validates that a file was actually uploaded
 * @param file - The uploaded file object (can be undefined)
 * @param fieldName - The field name expected
 * @throws AppError if no file was uploaded
 */
export const validateFileExists = (
  file: Express.Multer.File | undefined,
  fieldName: string,
): void => {
  if (!file) {
    throw new AppError(
      `No file uploaded for field '${fieldName}'`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
};

/**
 * Validates that files were actually uploaded (for multiple uploads)
 * @param files - Array of uploaded files (can be undefined or empty)
 * @param fieldName - The field name expected
 * @throws AppError if no files were uploaded
 */
export const validateFilesExist = (
  files: Express.Multer.File[] | undefined,
  fieldName: string,
): void => {
  if (!files || files.length === 0) {
    throw new AppError(
      `No files uploaded for field '${fieldName}'`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
};
