import { body } from "express-validator";
import { NotificationType, TargetType } from "./notification.types";

export const adminNotificationValidation = [
  body("targetType")
    .isIn(["all", "rider", "driver"] as TargetType[])
    .withMessage("Target type must be 'all', 'rider', or 'driver'"),
  body("title").trim().notEmpty().withMessage("Title is required"),
  //   body("body").trim().notEmpty().withMessage("Body is required"),
  body("data").trim().notEmpty().withMessage("Data is required"),
  body("type")
    .isIn(["PROMO", "SERVICE_UPDATE", "ANNOUNCEMENT"] as NotificationType[])
    .withMessage("Type must be PROMO, SERVICE_UPDATE, or ANNOUNCEMENT"),
];
