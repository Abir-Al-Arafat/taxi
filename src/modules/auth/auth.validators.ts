import type { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";

const allowedGenders = ["male", "female", "other"] as const;
const allowedRoles = ["rider", "driver"] as const;
const allowedVerifyOtpPurposes = ["signup", "forgot-password"] as const;

const trimAndRequire = (fieldName: string, message: string) =>
  body(fieldName).trim().notEmpty().withMessage(message);

const validateLocationInput = () =>
  body("location").custom((value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error("Location must be an object with lat and lng");
    }

    const locationValue = value as {
      lat?: unknown;
      lng?: unknown;
      address?: unknown;
    };

    const hasValidLat =
      typeof Number(locationValue.lat) === "number" &&
      Number.isFinite(Number(locationValue.lat));
    const hasValidLng =
      typeof Number(locationValue.lng) === "number" &&
      Number.isFinite(Number(locationValue.lng));

    if (!hasValidLat || !hasValidLng) {
      throw new Error(
        "Location coordinates must include numeric lat and lng values",
      );
    }

    const lat = Number(locationValue.lat);
    const lng = Number(locationValue.lng);

    if (lat < -90 || lat > 90) {
      throw new Error("Location latitude must be between -90 and 90");
    }

    if (lng < -180 || lng > 180) {
      throw new Error("Location longitude must be between -180 and 180");
    }

    locationValue.lat = lat;
    locationValue.lng = lng;

    if (
      typeof locationValue.address !== "undefined" &&
      typeof locationValue.address !== "string"
    ) {
      throw new Error("Location address must be a string when provided");
    }

    return true;
  });

const validateOtpFormat = (fieldName: string) =>
  body(fieldName)
    .trim()
    .matches(/^\d{4}$/)
    .withMessage("OTP must be a 4 digit code");

export const signupValidation = [
  trimAndRequire("firstName", "First name is required"),
  trimAndRequire("lastName", "Last name is required"),
  trimAndRequire("phoneNumber", "Phone number is required"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email is required")
    .normalizeEmail(),
  validateLocationInput(),
  body("location.address")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Location address must be a string")
    .trim(),
  // body("gender")
  //   .trim()
  //   .isIn([...allowedGenders])
  //   .withMessage("Gender must be male, female, or other"),
  body("role")
    .trim()
    .isIn([...allowedRoles])
    .withMessage("Role must be rider or driver"),
  trimAndRequire("password", "Password is required"),
  trimAndRequire("confirmPassword", "Confirm password is required"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }

    return true;
  }),
];

export const normalizeSignupLocationFields = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const locationValue = req.body.location;

  if (typeof locationValue === "string" && locationValue.trim().length > 0) {
    try {
      req.body.location = JSON.parse(locationValue);
    } catch {
      req.body.location = { address: locationValue };
    }
  }

  const latValue = req.body["location[lat]"];
  const lngValue = req.body["location[lng]"];
  const addressValue = req.body["location[address]"];
  const dotLatValue = req.body["location.lat"];
  const dotLngValue = req.body["location.lng"];
  const dotAddressValue = req.body["location.address"];

  if (typeof req.body.location !== "object" || req.body.location === null) {
    req.body.location = {};
  }

  if (typeof latValue !== "undefined") {
    req.body.location.lat = Number(latValue);
  } else if (typeof dotLatValue !== "undefined") {
    req.body.location.lat = Number(dotLatValue);
  }

  if (typeof lngValue !== "undefined") {
    req.body.location.lng = Number(lngValue);
  } else if (typeof dotLngValue !== "undefined") {
    req.body.location.lng = Number(dotLngValue);
  }

  if (typeof addressValue === "string" && addressValue.trim().length > 0) {
    req.body.location.address = addressValue.trim();
  } else if (
    typeof dotAddressValue === "string" &&
    dotAddressValue.trim().length > 0
  ) {
    req.body.location.address = dotAddressValue.trim();
  }

  delete req.body["location[lat]"];
  delete req.body["location[lng]"];
  delete req.body["location[address]"];
  delete req.body["location.lat"];
  delete req.body["location.lng"];
  delete req.body["location.address"];

  next();
};

export const loginValidation = [
  trimAndRequire("phoneNumber", "Phone number is required"),
  trimAndRequire("password", "Password is required"),
];

export const forgotPasswordValidation = [
  trimAndRequire("phoneNumber", "Phone number is required"),
];

export const resendOtpValidation = [
  trimAndRequire("phoneNumber", "Phone number is required"),
];

export const verifyOtpValidation = [
  trimAndRequire("phoneNumber", "Phone number is required"),
  body("purpose")
    .trim()
    .isIn([...allowedVerifyOtpPurposes])
    .withMessage("Purpose must be signup or forgot-password"),
  validateOtpFormat("otp"),
];

export const resetPasswordValidation = [
  trimAndRequire("phoneNumber", "Phone number is required"),
  trimAndRequire("password", "Password is required"),
  trimAndRequire("confirmPassword", "Confirm password is required"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
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
        errors.array()[0]?.msg ?? "Invalid request",
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
    return;
  }

  next();
};
