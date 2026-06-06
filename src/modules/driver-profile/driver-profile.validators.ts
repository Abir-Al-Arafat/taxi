import type { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";

const allowedGenders = ["male", "female", "other"] as const;
const allowedVehicleTypes = ["taxi", "normal car"] as const;

const trimAndRequire = (fieldName: string, message: string) =>
  body(fieldName).trim().notEmpty().withMessage(message);

const normalizeArrayValue = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  try {
    const parsedValue = JSON.parse(value) as unknown;

    if (Array.isArray(parsedValue)) {
      return parsedValue.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [value.trim()].filter(Boolean);
};

const validateDateOfBirth = (isUpdate: boolean) =>
  body("dateOfBirth")
    .optional({ values: "falsy" })
    .custom((value) => {
      if (!isUpdate && typeof value !== "string") {
        throw new Error("Date of birth is required");
      }

      const parsedDate = new Date(value);

      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("Date of birth must be a valid date");
      }

      return true;
    });

const validateStringArray = (
  fieldName: string,
  message: string,
  _isUpdate: boolean,
) =>
  body(fieldName)
    .optional({ values: "falsy" })
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error(message);
      }

      const hasOnlyStrings = value.every(
        (item) => typeof item === "string" && item.trim().length > 0,
      );

      if (!hasOnlyStrings) {
        throw new Error(message);
      }

      return true;
    });

const validateVehicleFields = (isUpdate: boolean) => [
  body("vehicleType")
    .optional({ values: "falsy" })
    .trim()
    .isIn([...allowedVehicleTypes])
    .withMessage("Vehicle type must be taxi or normal car"),
  body("carCompany")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Car company is required"),
  body("model")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Vehicle model is required"),
  body("year")
    .optional({ values: "falsy" })
    .custom((value) => {
      const parsedYear = Number(value);

      if (!Number.isInteger(parsedYear)) {
        throw new Error("Vehicle year must be a whole number");
      }

      if (parsedYear < 1900 || parsedYear > 2100) {
        throw new Error("Vehicle year must be between 1900 and 2100");
      }

      return true;
    }),
  body("color")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Vehicle color is required"),
  body("plateNumber")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Plate number is required"),
  ...(isUpdate
    ? [
        body().custom((_, { req }) => {
          const fields = [
            "dateOfBirth",
            "gender",
            "nidOrPassport",
            "profileImage",
            "drivingLicenseImages",
            "vehicleRegistrationDocumentImages",
            "vehicleType",
            "carCompany",
            "model",
            "year",
            "color",
            "plateNumber",
          ];

          const hasAnyField = fields.some((field) => {
            const fieldValue = req.body[field];

            if (Array.isArray(fieldValue)) {
              return fieldValue.length > 0;
            }

            return (
              typeof fieldValue !== "undefined" &&
              String(fieldValue).trim().length > 0
            );
          });

          if (!hasAnyField) {
            throw new Error("At least one profile field is required");
          }

          return true;
        }),
      ]
    : []),
];

const buildProfileValidation = (isUpdate: boolean) => {
  if (isUpdate) {
    return [
      validateDateOfBirth(true),
      body("gender")
        .optional({ values: "falsy" })
        .trim()
        .isIn([...allowedGenders])
        .withMessage("Gender must be male, female, or other"),
      body("nidOrPassport")
        .optional({ values: "falsy" })
        .trim()
        .notEmpty()
        .withMessage("NID/passport is required"),
      body("profileImage")
        .optional({ values: "falsy" })
        .trim()
        .notEmpty()
        .withMessage("Profile image is required"),
      validateStringArray(
        "drivingLicenseImages",
        "Driving license images are required",
        true,
      ),
      validateStringArray(
        "vehicleRegistrationDocumentImages",
        "Vehicle registration document images are required",
        true,
      ),
      ...validateVehicleFields(true),
    ];
  }

  return [
    validateDateOfBirth(false),
    body("gender")
      .trim()
      .isIn([...allowedGenders])
      .withMessage("Gender must be male, female, or other"),
    trimAndRequire("nidOrPassport", "NID/passport is required"),
    trimAndRequire("profileImage", "Profile image is required"),
    validateStringArray(
      "drivingLicenseImages",
      "Driving license images are required",
      false,
    ),
    validateStringArray(
      "vehicleRegistrationDocumentImages",
      "Vehicle registration document images are required",
      false,
    ),
    ...validateVehicleFields(false),
  ];
};

export const completeDriverProfileValidation = buildProfileValidation(false);
export const updateDriverProfileValidation = buildProfileValidation(true);

export const normalizeDriverProfilePayload = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const fieldsToNormalize = [
    "drivingLicenseImages",
    "vehicleRegistrationDocumentImages",
  ] as const;

  for (const fieldName of fieldsToNormalize) {
    const normalizedValue = normalizeArrayValue(req.body[fieldName]);

    if (typeof normalizedValue !== "undefined") {
      req.body[fieldName] = normalizedValue;
    }
  }

  if (typeof req.body.year !== "undefined") {
    req.body.year = Number(req.body.year);
  }

  next();
};

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
