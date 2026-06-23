import { body, param, query } from "express-validator";

export const validateSendMessage = [
  body("receiverId")
    .isString()
    .notEmpty()
    .withMessage("Receiver ID is required"),
  body("content")
    .isString()
    .notEmpty()
    .withMessage("Message content cannot be empty"),
  body("rideId").optional().isString(),
];

export const validateGetConversation = [
  param("targetUserId")
    .isString()
    .notEmpty()
    .withMessage("Target user ID is required"),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("skip").optional().isInt({ min: 0 }).toInt(),
];
