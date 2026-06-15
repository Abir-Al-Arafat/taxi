// src/modules/fare/fare.route.ts
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdminRole } from "../../middlewares/admin.middleware";
import { FareController } from "./fare.controller";
import {
  createFareValidation,
  updateFareValidation,
  handleValidationErrors,
} from "./fare.validators";

const router = Router();
const upload = multer();
const controller = new FareController();

router.post(
  "/",
  authenticate,
  requireAdminRole,
  upload.none(),
  createFareValidation,
  handleValidationErrors,
  controller.createPricingRule,
);

// Global protected path for drivers/riders to view system prices
router.get("/", authenticate, controller.getPricingRules);

// Highly restricted PATCH endpoint limited entirely to admins
router.patch(
  "/:gender",
  authenticate,
  requireAdminRole,
  upload.none(),
  updateFareValidation,
  handleValidationErrors,
  controller.updatePricingRule,
);

export { router as fareRouter };
