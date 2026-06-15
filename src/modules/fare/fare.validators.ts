// src/modules/fare/fare.validators.ts
import { body, param, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";

export const createFareValidation = [
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Gender parameter must map to valid system enums"),
  body("baseFare")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage("Base fare is required and must be a positive number"),
  body("minimumFare")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage("Minimum fare is required and must be a positive number"),
  body("pricePerMinute")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage("Price per minute is required and must be a positive number"),
  body("pricePerKilometer")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage(
      "Price per kilometer is required and must be a positive number",
    ),
  body("waitingTimeCharge")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage(
      "Waiting time charge is required and must be a positive number",
    ),
  body("cancellationFee")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage("Cancellation fee is required and must be a positive number"),
  body("commissionPercentage")
    .notEmpty()
    .isFloat({ min: 0, max: 100 })
    .withMessage(
      "Commission percentage is required and must be between 0 and 100",
    ),
];

export const updateFareValidation = [
  param("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Gender parameter must be male, female, or other"),

  body("baseFare")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Base fare must be a positive number"),
  body("minimumFare")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum fare must be a positive number"),
  body("pricePerMinute")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price per minute must be a positive number"),
  body("pricePerKilometer")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price per kilometer must be a positive number"),
  body("waitingTimeCharge")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Waiting time charge must be a positive number"),
  body("cancellationFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cancellation fee must be a positive number"),
  body("commissionPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Commission percentage must fall directly between 0 and 100"),
];

export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  console.log("Validation errors details:", errors.array());
  if (!errors.isEmpty()) {
    next(
      new AppError(
        errors.array()[0]?.msg ?? "Invalid numeric thresholds provided",
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
    return;
  }
  next();
};
