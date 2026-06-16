// src/modules/voucher/voucher.validators.ts
import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";

export const generateBatchValidation = [
  body("quantity")
    .isInt({ min: 1, max: 1000 })
    .withMessage("Quantity must be between 1 and 1000"),
  body("value")
    .isFloat({ min: 1 })
    .withMessage("Value must be a positive number"),
  body("batchName").optional().isString().trim(),
  body("expiryDate")
    .optional()
    .isISO8601()
    .withMessage("Must be a valid ISO8601 date"),
];

export const redeemValidation = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Voucher code is strictly required"),
  body("promoCode").optional().trim().isString(),
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
        errors.array()[0]?.msg ?? "Invalid payload",
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
    return;
  }
  next();
};
