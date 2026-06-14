import type { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";

const allowedGenders = ["male", "female", "other"] as const;
const allowedVehicleTypes = ["taxi", "normal car"] as const;

const trimAndRequire = (fieldName: string, message: string) =>
  body(fieldName).trim().notEmpty().withMessage(message);

const validateDateOfBirth = (isUpdate: boolean) =>
  body("dateOfBirth")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (isUpdate && (value === undefined || value === null || value === "")) {
        return true;
      }

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
  isUpdate: boolean,
) =>
  body(fieldName)
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (isUpdate && (value === undefined || value === null || value === "")) {
        return true;
      }

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
    .optional({ checkFalsy: true })
    .trim()
    .isIn([...allowedVehicleTypes])
    .withMessage("Vehicle type must be taxi or normal car"),
  body("carCompany")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Car company is required"),
  body("model")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Vehicle model is required"),
  body("year")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (value === undefined || value === null || value === "") return true;
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
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Vehicle color is required"),
  body("plateNumber")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Plate number is required"),
];

const buildProfileValidation = (isUpdate: boolean) => {
  if (isUpdate) {
    return [
      validateDateOfBirth(true),
      body("gender")
        .optional({ checkFalsy: true })
        .trim()
        .isIn([...allowedGenders])
        .withMessage("Gender must be male, female, or other"),
      body("nidOrPassport")
        .optional({ checkFalsy: true })
        .trim()
        .notEmpty()
        .withMessage("NID/passport is required"),
      body("profilePicture")
        .optional({ checkFalsy: true })
        .trim()
        .notEmpty()
        .withMessage("Profile picture is required"),
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

      // EXPLICIT GUARD: Catch empty bodies on update routes gracefully
      body().custom((_, { req }) => {
        const fields = [
          "dateOfBirth",
          "gender",
          "nidOrPassport",
          "profilePicture",
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
          const fieldValue = req.body?.[field];

          if (Array.isArray(fieldValue)) {
            return fieldValue.length > 0;
          }

          return (
            fieldValue !== undefined &&
            fieldValue !== null &&
            String(fieldValue).trim().length > 0
          );
        });

        if (!hasAnyField) {
          throw new Error("No Data provided for update");
        }

        return true;
      }),
    ];
  }

  return [
    validateDateOfBirth(false),
    body("gender")
      .trim()
      .isIn([...allowedGenders])
      .withMessage("Gender must be male, female, or other"),
    trimAndRequire("nidOrPassport", "NID/passport is required"),
    trimAndRequire("profilePicture", "Profile picture is required"),
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
  if (
    req.body &&
    typeof req.body.data === "string" &&
    req.body.data.trim() !== ""
  ) {
    try {
      const parsedData = JSON.parse(req.body.data);
      req.body = { ...req.body, ...parsedData };
    } catch (error) {
      req.body.dataParseError = true;
    }
  }

  if (!req.files) {
    next();
    return;
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const docUploadPath = "public/uploads/driver-docs";
  const avatarUploadPath = "public/uploads/profile-pictures";

  if (files["profilePicture"]?.[0]) {
    req.body.profilePicture = `${avatarUploadPath}/${files["profilePicture"][0].filename}`;
  }

  if (files["nidOrPassport"]?.[0]) {
    req.body.nidOrPassport = `${docUploadPath}/${files["nidOrPassport"][0].filename}`;
  }

  if (files["drivingLicenseImages"]) {
    req.body.drivingLicenseImages = files["drivingLicenseImages"].map(
      (file) => `${docUploadPath}/${file.filename}`,
    );
  }

  if (files["vehicleRegistrationDocumentImages"]) {
    req.body.vehicleRegistrationDocumentImages = files[
      "vehicleRegistrationDocumentImages"
    ].map((file) => `${docUploadPath}/${file.filename}`);
  }

  next();
};

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
        errors.array()[0]?.msg ?? "Invalid request",
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
    return;
  }

  next();
};
