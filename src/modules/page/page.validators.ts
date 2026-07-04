import { body, param } from "express-validator";
import { PageTypes } from "./page.schema";

export const validatePageType = [
  param("type")
    .isIn(PageTypes)
    .withMessage(`Invalid page type. Allowed types: ${PageTypes.join(", ")}`),
];

export const validateUpdatePage = [
  ...validatePageType,
  body("content")
    .isString()
    .withMessage("Content must be a string")
    .notEmpty()
    .withMessage("Content is required"),
];
