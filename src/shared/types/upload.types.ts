import type { Request } from "express";

/**
 * Upload configuration options
 */
export interface UploadOptions {
  /** Field name in the multipart form data */
  fieldName: string;
  /** Maximum file size in bytes (default: 5MB) */
  maxFileSize?: number;
  /** Allowed MIME types (e.g., ['image/jpeg', 'image/png']) */
  allowedMimeTypes?: readonly string[];
  /** Upload directory path (default: 'uploads/') */
  uploadDir?: string;
  /** Whether to accept multiple files (default: false) */
  multiple?: boolean;
  /** Maximum number of files when multiple is true (default: 5) */
  maxFiles?: number;
  /** Custom filename function (optional) */
  filename?: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => void;
}

/**
 * Extended Request interface with uploaded file(s)
 * Uses multer's native Express.Multer.File type
 */
export interface UploadRequest extends Request {
  /** Single uploaded file (multer's native File type) */
  file?: Express.Multer.File;
  /** Array of uploaded files (multer's native File type) */
  files?: Express.Multer.File[];
}
