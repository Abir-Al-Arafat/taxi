import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { AuthController } from "./auth.controller";
import {
  forgotPasswordValidation,
  handleValidationErrors,
  loginValidation,
  normalizeSignupLocationFields,
  resendOtpValidation,
  resetPasswordValidation,
  signupValidation,
  verifyOtpValidation,
} from "./auth.validators";

const router = Router();
const upload = multer();
const authController = new AuthController();

router.post(
  "/signup",
  upload.none(),
  normalizeSignupLocationFields,
  signupValidation,
  handleValidationErrors,
  authController.signup,
);
router.post(
  "/login",
  upload.none(),
  loginValidation,
  handleValidationErrors,
  authController.login,
);
router.post(
  "/forgot-password",
  upload.none(),
  forgotPasswordValidation,
  handleValidationErrors,
  authController.forgotPassword,
);
router.post(
  "/resend-otp",
  upload.none(),
  resendOtpValidation,
  handleValidationErrors,
  authController.resendOtp,
);
router.post(
  "/verify-otp",
  upload.none(),
  verifyOtpValidation,
  handleValidationErrors,
  authController.verifyOtp,
);
router.post(
  "/reset-password",
  upload.none(),
  resetPasswordValidation,
  handleValidationErrors,
  authController.resetPassword,
);
router.post("/refresh", authController.refresh);
router.post("/logout", authenticate, authController.logout);

export { router as authRouter };
