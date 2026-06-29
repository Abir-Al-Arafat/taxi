// Example: src/middlewares/validation.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import HTTP_STATUS from "../constants/statusCodes";
import { AppError } from "../core/errors/AppError";

export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  console.log("Validation errors:", errors.array()); // Debugging line

  if (!errors.isEmpty()) {
    next(
      new AppError(
        errors.array()[0]?.msg ?? "Invalid request payload",
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
    return;
  }
  next();
};
