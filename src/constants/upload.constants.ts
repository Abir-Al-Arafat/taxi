/**
 * File upload constants
 * Common MIME types and default limits for file uploads
 */

/** Default maximum file size: 5MB in bytes */
export const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Default maximum number of files for multiple uploads */
export const DEFAULT_MAX_FILES = 5;

/** Default upload directory */
export const DEFAULT_UPLOAD_DIR = "uploads/";

/** Common image MIME types */
export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
] as const;

/** Common document MIME types */
export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
] as const;

/** Common video MIME types */
export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/webm",
] as const;

/** Common audio MIME types */
export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
  "audio/x-m4a",
] as const;

/** All allowed MIME types combined */
export const ALL_ALLOWED_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
  ...AUDIO_MIME_TYPES,
] as const;
