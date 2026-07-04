import { Router } from "express";
import multer from "multer";
import { PageController } from "./page.controller";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { validatePageType, validateUpdatePage } from "./page.validators";
import { handleValidationErrors } from "../../middlewares/validation.middleware";
// import { adminMiddleware } from "../../middlewares/admin.middleware";

const router = Router();
const upload = multer();

// GET /api/v1/pages/terms_conditions
router.get(
  "/:type",
  validatePageType,
  handleValidationErrors,
  asyncHandler(PageController.getPage),
);

// PUT /api/v1/pages/terms_conditions
router.put(
  "/:type",
  // adminMiddleware, // Protect this endpoint so only admins can change policies!
  upload.none(),
  validateUpdatePage,
  handleValidationErrors,
  asyncHandler(PageController.updatePage),
);

export default router;
