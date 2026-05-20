import { NextFunction, Request, Response } from "express";
import multer from "multer";

import { AppError } from "../core/errors/AppError";
import { ResponseBuilder } from "../core/utils/apiResponse";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(ResponseBuilder.failure(err.message));
    return;
  }
  // Multer errors
  if (err instanceof multer.MulterError) {
    let message = err.message;

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File size exceeds limit";
        break;

      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        break;

      default:
        message = err.message;
    }

    res.status(400).json(ResponseBuilder.failure(message));

    return;
  }
  console.error("Unexpected error", {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json(ResponseBuilder.failure("Internal server error"));
};
