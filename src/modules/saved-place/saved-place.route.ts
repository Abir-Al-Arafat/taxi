import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { SavedPlaceController } from "./saved-place.controller";
import {
  createSavedPlaceValidation,
  updateSavedPlaceValidation,
  handleValidationErrors,
} from "./saved-place.validators";

const router = Router();
const upload = multer();
const controller = new SavedPlaceController();

// All saved place routes require the user to be logged in
router.use(authenticate);

router.post(
  "/",
  upload.none(),
  createSavedPlaceValidation,
  handleValidationErrors,
  controller.create,
);
router.get("/", controller.getAll);
router.patch(
  "/:id",
  upload.none(),
  updateSavedPlaceValidation,
  handleValidationErrors,
  controller.update,
);
router.delete("/:id", controller.delete);

export { router as savedPlaceRouter };
