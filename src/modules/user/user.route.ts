import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { UserController } from "./user.controller";

const router = Router();
const upload = multer();
const userController = new UserController();

router.get("/", userController.getAllUsers);

router.get("/:id", userController.getUserById);

export { router as userRouter };
