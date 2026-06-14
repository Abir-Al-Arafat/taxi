import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";

export const createSavedPlaceValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Place name is required (e.g., 'Home')"),
  body("address").trim().notEmpty().withMessage("Address string is required"),
  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be a valid coordinate between -180 and 180"),
  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be a valid coordinate between -90 and 90"),
];

export const updateSavedPlaceValidation = [
  body("name").optional({ checkFalsy: true }).trim().notEmpty(),
  body("address").optional({ checkFalsy: true }).trim().notEmpty(),
  body("longitude")
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
  body("latitude")
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  // Custom check: if they provide long, they MUST provide lat
  body().custom((value, { req }) => {
    if (
      (req.body.longitude && !req.body.latitude) ||
      (!req.body.longitude && req.body.latitude)
    ) {
      throw new Error(
        "Both longitude and latitude must be provided together if updating location",
      );
    }
    return true;
  }),
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
        errors.array()[0]?.msg ?? "Invalid request payload",
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
    return;
  }
  next();
};
