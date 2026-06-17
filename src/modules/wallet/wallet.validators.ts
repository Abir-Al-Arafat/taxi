// src/modules/wallet/wallet.validators.ts
import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";

export const adminWalletAdjustmentValidation = [
  body("driverId")
    .isMongoId()
    .withMessage("A valid Driver ID must be provided"),
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be strictly greater than zero"),
  body("description").optional().isString().trim(),
];

export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(
      new AppError(
        errors.array()[0]?.msg ?? "Invalid payload parameters",
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
    return;
  }
  next();
};
