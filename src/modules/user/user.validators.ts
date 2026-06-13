import type { NextFunction, Request, Response } from "express";
export const normalizeUserProfilePayload = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  // If no files were uploaded, fall through to validation directly
  if (!req.files) {
    next();
    return;
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const baseUploadPath = "public/uploads/profile-pictures"; // Force public directory prefix here
  console.log("files", files);
  console.log("files profilePicture [0]", files["profilePicture"]?.[0]);
  // 1. Process Single Fields safely
  if (files["profilePicture"]?.[0]) {
    req.body.profilePicture = `${baseUploadPath}/${files["profilePicture"][0].filename}`;
  }

  if (files["nidOrPassport"]?.[0]) {
    req.body.nidOrPassport = `${baseUploadPath}/${files["nidOrPassport"][0].filename}`;
  }

  // 2. Process Multi-File Array Fields cleanly
  if (files["drivingLicenseImages"]) {
    req.body.drivingLicenseImages = files["drivingLicenseImages"].map(
      (file) => `${baseUploadPath}/${file.filename}`,
    );
  }

  if (files["vehicleRegistrationDocumentImages"]) {
    req.body.vehicleRegistrationDocumentImages = files[
      "vehicleRegistrationDocumentImages"
    ].map((file) => `${baseUploadPath}/${file.filename}`);
  }

  next();
};
