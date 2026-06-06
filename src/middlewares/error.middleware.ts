import { NextFunction, Request, Response } from "express";
import multer from "multer";

import { AppError } from "../core/errors/AppError";
import { ResponseBuilder } from "../core/utils/apiResponse";
import HTTP_STATUS from "../constants/statusCodes";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json(ResponseBuilder.failure(err.message, err.statusCode));
    return;
  }
  // Multer errors
  if (err instanceof multer.MulterError) {
    let message = err.message;
    console.log("err", err);
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

    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(ResponseBuilder.failure(message, HTTP_STATUS.BAD_REQUEST));

    return;
  }
  console.error("Unexpected error", {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(
      ResponseBuilder.failure(
        "Internal server error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ),
    );
};
