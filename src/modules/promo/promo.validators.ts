// src/modules/promo/promo.validators.ts
import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";

export const createPromoValidation = [
  body("code")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Promo code is required"),
  body("discountType")
    .isIn(["percentage", "fixed_amount"])
    .withMessage("Invalid discount type"),
  body("discountValue")
    .isFloat({ gt: 0 })
    .withMessage("Discount value must be greater than 0"),
  body("totalUsageLimit").isInt({ min: 1 }),
  body("startDate").isISO8601(),
  body("expiryDate").isISO8601(),
  body("rules").optional().isArray(),
  body("rules.*.ruleKey").isIn([
    "user_type",
    "total_rides",
    "days_since_last_ride",
  ]),
  body("rules.*.ruleOperator").isIn(["equals", "greater_than", "less_than"]),
  body("rules.*.ruleValue").notEmpty(),
];

export const applyPromoValidation = [
  body("code")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Promo code is required"),
  body("estimatedFare").optional().isFloat({ min: 0 }),
];

export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  console.log("Validation Errors:", errors.array());
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
