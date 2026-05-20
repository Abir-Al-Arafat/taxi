import { Router } from "express";
import multer from "multer";
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
  resetPasswordValidation,
  handleValidationErrors,
  authController.resetPassword,
);

export { router as authRouter };
