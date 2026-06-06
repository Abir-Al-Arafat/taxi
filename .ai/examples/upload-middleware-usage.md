# File Upload Middleware - Usage Examples

This document provides comprehensive examples for using the file upload middleware in the SwiftRide Taxi Backend.

## Table of Contents

1. [Basic Single File Upload](#basic-single-file-upload)
2. [Multiple File Upload](#multiple-file-upload)
3. [Custom Configuration](#custom-configuration)
4. [Pre-configured Middleware](#pre-configured-middleware)
5. [Validation After Upload](#validation-after-upload)
6. [Complete Route Example](#complete-route-example)

---

## Basic Single File Upload

### Using createUploadMiddleware

```typescript
import { Router } from "express";
import { asyncHandler } from "../core/utils/asyncHandler";
import { ResponseBuilder } from "../core/utils/apiResponse";
import { createUploadMiddleware } from "../middlewares/upload.middleware";
import type { UploadRequest } from "../shared/types/upload.types";
import HTTP_STATUS from "../constants/statusCodes";

const router = Router();

// Configure single file upload
const uploadAvatar = createUploadMiddleware({
  fieldName: "avatar",
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  uploadDir: "uploads/avatars",
  multiple: false,
});

/**
 * Upload user avatar
 * POST /api/v1/users/avatar
 */
router.post(
  "/avatar",
  uploadAvatar,
  asyncHandler(async (req: UploadRequest, res) => {
    const file = req.file;

    if (!file) {
      throw new AppError("No file uploaded", HTTP_STATUS.BAD_REQUEST);
    }

    // Process the file (e.g., save URL to database)
    const avatarUrl = `/uploads/avatars/${file.filename}`;

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Avatar uploaded successfully",
          { url: avatarUrl, filename: file.filename },
          HTTP_STATUS.OK,
        ),
      );
  }),
);
```

---

## Multiple File Upload

### Using createUploadMiddleware with multiple: true

```typescript
import { Router } from "express";
import { asyncHandler } from "../core/utils/asyncHandler";
import { ResponseBuilder } from "../core/utils/apiResponse";
import { createUploadMiddleware } from "../middlewares/upload.middleware";
import type { UploadRequest } from "../shared/types/upload.types";
import HTTP_STATUS from "../constants/statusCodes";

const router = Router();

// Configure multiple file upload
const uploadDocuments = createUploadMiddleware({
  fieldName: "documents",
  maxFileSize: 5 * 1024 * 1024, // 5MB per file
  allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  uploadDir: "uploads/documents",
  multiple: true,
  maxFiles: 10,
});

/**
 * Upload multiple documents
 * POST /api/v1/documents
 */
router.post(
  "/documents",
  uploadDocuments,
  asyncHandler(async (req: UploadRequest, res) => {
    const files = req.files;

    if (!files || files.length === 0) {
      throw new AppError("No files uploaded", HTTP_STATUS.BAD_REQUEST);
    }

    // Process files (e.g., save URLs to database)
    const uploadedFiles = files.map((file) => ({
      url: `/uploads/documents/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          `${files.length} documents uploaded successfully`,
          { files: uploadedFiles },
          HTTP_STATUS.OK,
        ),
      );
  }),
);
```

---

## Custom Configuration

### Custom Filename Function

```typescript
import { createUploadMiddleware } from "../middlewares/upload.middleware";
import type { UploadRequest } from "../shared/types/upload.types";

const uploadWithCustomName = createUploadMiddleware({
  fieldName: "photo",
  maxFileSize: 3 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png"],
  uploadDir: "uploads/photos",
  multiple: false,
  filename: (req, file, cb) => {
    // Custom filename: userId-timestamp.ext
    const userId = req.body.userId || "unknown";
    const timestamp = Date.now();
    const ext = file.originalname.split(".").pop();
    cb(null, `${userId}-${timestamp}.${ext}`);
  },
});
```

### Using Constants for MIME Types

```typescript
import { createUploadMiddleware } from "../middlewares/upload.middleware";
import { IMAGE_MIME_TYPES, DOCUMENT_MIME_TYPES } from "../constants/upload.constants";

const uploadImageOrDoc = createUploadMiddleware({
  fieldName: "file",
  maxFileSize: 10 * 1024 * 1024,
  allowedMimeTypes: [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES],
  uploadDir: "uploads/mixed",
  multiple: false,
});
```

---

## Pre-configured Middleware

### Using Built-in Helpers

```typescript
import { Router } from "express";
import { asyncHandler } from "../core/utils/asyncHandler";
import { ResponseBuilder } from "../core/utils/apiResponse";
import {
  uploadSingleImage,
  uploadMultipleImages,
  uploadSingleDocument,
} from "../middlewares/upload.middleware";
import type { UploadRequest } from "../shared/types/upload.types";
import HTTP_STATUS from "../constants/statusCodes";

const router = Router();

/**
 * Upload single image (default: 5MB, image types only)
 * POST /api/v1/upload/image
 */
router.post(
  "/image",
  uploadSingleImage("photo"),
  asyncHandler(async (req: UploadRequest, res) => {
    const file = req.file;
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Image uploaded successfully",
          { url: `/uploads/${file?.filename}` },
          HTTP_STATUS.OK,
        ),
      );
  }),
);

/**
 * Upload multiple images (default: 5MB per file, 5 files max)
 * POST /api/v1/upload/images
 */
router.post(
  "/images",
  uploadMultipleImages("photos", 10), // Custom max files
  asyncHandler(async (req: UploadRequest, res) => {
    const files = req.files;
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          `${files?.length} images uploaded successfully`,
          { count: files?.length },
          HTTP_STATUS.OK,
        ),
      );
  }),
);

/**
 * Upload single document (default: 10MB, document types only)
 * POST /api/v1/upload/document
 */
router.post(
  "/document",
  uploadSingleDocument("file"),
  asyncHandler(async (req: UploadRequest, res) => {
    const file = req.file;
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Document uploaded successfully",
          { url: `/uploads/${file?.filename}` },
          HTTP_STATUS.OK,
        ),
      );
  }),
);
```

---

## Validation After Upload

### Using validateUploadedFile Middleware

```typescript
import { Router } from "express";
import { asyncHandler } from "../core/utils/asyncHandler";
import { ResponseBuilder } from "../core/utils/apiResponse";
import {
  createUploadMiddleware,
  validateUploadedFile,
} from "../middlewares/upload.middleware";
import type { UploadRequest } from "../shared/types/upload.types";
import HTTP_STATUS from "../constants/statusCodes";

const router = Router();

const uploadProfilePic = createUploadMiddleware({
  fieldName: "profilePic",
  maxFileSize: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png"],
  uploadDir: "uploads/profiles",
  multiple: false,
});

/**
 * Upload profile picture with additional validation
 * POST /api/v1/users/profile-picture
 */
router.post(
  "/profile-picture",
  uploadProfilePic,
  validateUploadedFile({
    required: true,
    maxFileSize: 3 * 1024 * 1024, // Additional size check (3MB)
  }),
  asyncHandler(async (req: UploadRequest, res) => {
    const file = req.file;

    // Additional business logic validation
    if (!file) {
      throw new AppError("Profile picture is required", HTTP_STATUS.BAD_REQUEST);
    }

    // Process file
    const profilePicUrl = `/uploads/profiles/${file.filename}`;

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Profile picture uploaded successfully",
          { url: profilePicUrl },
          HTTP_STATUS.OK,
        ),
      );
  }),
);
```

---

## Complete Route Example

### Full Module Implementation

```typescript
import { Router } from "express";
import { asyncHandler } from "../core/utils/asyncHandler";
import { ResponseBuilder } from "../core/utils/apiResponse";
import { AppError } from "../core/errors/AppError";
import {
  createUploadMiddleware,
  validateUploadedFile,
} from "../middlewares/upload.middleware";
import { IMAGE_MIME_TYPES } from "../constants/upload.constants";
import type { UploadRequest } from "../shared/types/upload.types";
import HTTP_STATUS from "../constants/statusCodes";

const router = Router();

// Upload configuration for driver documents
const uploadDriverDocuments = createUploadMiddleware({
  fieldName: "documents",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    ...IMAGE_MIME_TYPES,
    "application/pdf",
    "image/jpeg",
    "image/png",
  ],
  uploadDir: "uploads/driver-documents",
  multiple: true,
  maxFiles: 5,
});

/**
 * Upload driver verification documents
 * POST /api/v1/drivers/documents
 */
router.post(
  "/documents",
  uploadDriverDocuments,
  validateUploadedFile({ required: true }),
  asyncHandler(async (req: UploadRequest, res) => {
    const files = req.files;
    const driverId = req.body.driverId;

    if (!driverId) {
      throw new AppError("Driver ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    if (!files || files.length === 0) {
      throw new AppError("No documents uploaded", HTTP_STATUS.BAD_REQUEST);
    }

    // Process each document
    const documentUrls = files.map((file) => ({
      url: `/uploads/driver-documents/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date(),
    }));

    // Here you would save to database via service layer
    // await driverService.uploadDocuments(driverId, documentUrls);

    res
      .status(HTTP_STATUS.CREATED)
      .json(
        ResponseBuilder.success(
          "Driver documents uploaded successfully",
          { driverId, documents: documentUrls },
          HTTP_STATUS.CREATED,
        ),
      );
  }),
);

export { router as uploadRouter };
```

---

## Error Handling

### Expected Error Responses

The middleware automatically handles common upload errors:

```json
// File too large
{
  "success": false,
  "status": 413,
  "message": "File size 6.50MB exceeds maximum allowed size of 5.00MB"
}

// Invalid file type
{
  "success": false,
  "status": 422,
  "message": "File type application/pdf is not allowed. Allowed types: image/jpeg, image/png"
}

// Too many files
{
  "success": false,
  "status": 400,
  "message": "Maximum 5 files allowed. Received 7 files."
}

// No file uploaded
{
  "success": false,
  "status": 400,
  "message": "No file uploaded for field 'avatar'"
}
```

---

## Best Practices

1. **Always validate file existence** in your controller after upload
2. **Use appropriate MIME type restrictions** for security
3. **Set reasonable file size limits** to prevent abuse
4. **Use custom upload directories** for different file types
5. **Sanitize filenames** if using custom filename functions
6. **Process files asynchronously** if performing additional operations
7. **Clean up old files** periodically to manage disk space
8. **Use validation middleware** for additional business logic checks

---

## Testing with cURL

### Single File Upload

```bash
curl -X POST http://localhost:5000/api/v1/users/avatar \
  -F "avatar=@/path/to/image.jpg"
```

### Multiple File Upload

```bash
curl -X POST http://localhost:5000/api/v1/documents \
  -F "documents=@/path/to/doc1.pdf" \
  -F "documents=@/path/to/doc2.pdf" \
  -F "documents=@/path/to/doc3.pdf"
```

### With Additional Form Data

```bash
curl -X POST http://localhost:5000/api/v1/drivers/documents \
  -F "documents=@/path/to/license.jpg" \
  -F "documents=@/path/to/insurance.pdf" \
  -F "driverId=12345"
```
