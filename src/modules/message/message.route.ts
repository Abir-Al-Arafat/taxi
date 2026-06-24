import { Router } from "express";
import multer from "multer";
import { MessageController } from "./message.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../core/utils/asyncHandler";
import {
  validateSendMessage,
  validateGetConversation,
} from "./message.validators";
// Assuming you have a validation middleware that executes express-validator rules
// import { validateRequest } from "../../middlewares/validation.middleware";

const router = Router();
const upload = multer();
const messageController = new MessageController();

// All message routes are protected
router.use(authenticate);

router.post(
  "/",
  upload.none(),
  validateSendMessage,
  // validateRequest, <-- Add your validation runner middleware here
  asyncHandler(messageController.sendMessage),
);

router.get(
  "/conversation/:targetUserId",
  validateGetConversation,
  // validateRequest,
  asyncHandler(messageController.getConversation),
);

router.patch("/read/:senderId", asyncHandler(messageController.markAsRead));

export const messageRouter = router;
