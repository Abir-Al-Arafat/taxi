import { body } from "express-validator";
import { ALL_SECTIONS } from "./admin.schema";

export const createAdminValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("role").trim().notEmpty().withMessage("Role is required"),
  body("sections")
    .isArray()
    .withMessage("Sections must be an array")
    .custom((sections: string[]) => {
      const invalidSections = sections.filter((s) => !ALL_SECTIONS.includes(s));
      if (invalidSections.length > 0) {
        throw new Error(`Invalid sections: ${invalidSections.join(", ")}`);
      }
      return true;
    }),
];
