import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { UserController } from "./user.controller";
import { uploadUserData } from "./user.middleware";
import { normalizeUserProfilePayload } from "./user.validators";

const router = Router();
const upload = multer();
const userController = new UserController();

router.get("/", userController.getAllUsers);

router.get("/:id", userController.getUserById);

router.patch(
  "/me",
  authenticate,
  uploadUserData,
  normalizeUserProfilePayload,
  userController.updateMyDetails,
);

export { router as userRouter };
