import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import { AuthService } from "./auth.service";
import { JwtService } from "../../shared/services/jwt.service";
import { env } from "../../config/env";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
  SignupRequest,
  VerifyOtpRequest,
} from "./auth.types";

export class AuthController {
  private readonly jwtService = new JwtService();

  constructor(private readonly authService = new AuthService()) {}

  signup = asyncHandler(
    async (
      req: Request<unknown, unknown, SignupRequest>,
      res: Response,
    ): Promise<void> => {
      const user = await this.authService.signup(req.body);

      res
        .status(201)
        .json(
          ResponseBuilder.success(
            "Account created successfully. Verification code sent to email.",
            user,
          ),
        );
    },
  );

  login = asyncHandler(
    async (
      req: Request<unknown, unknown, LoginRequest>,
      res: Response,
    ): Promise<void> => {
      const user = await this.authService.login(req.body);

      // Create tokens
      const accessToken = this.jwtService.signAccessToken({
        sub: user.id,
        role: user.role,
      });
      const refreshToken = this.jwtService.signRefreshToken({ sub: user.id });

      // Persist hashed refresh token
      await this.authService.saveRefreshToken(user.id, refreshToken);

      // compute maxAge from env.jwtRefreshExpiresIn (simple parser)
      const maxAge = (() => {
        const m = env.jwtRefreshExpiresIn.match(/^(\d+)([smhd])$/);
        if (!m) return 30 * 24 * 60 * 60 * 1000;
        const value = Number(m[1]);
        const unit = m[2];
        switch (unit) {
          case "s":
            return value * 1000;
          case "m":
            return value * 60 * 1000;
          case "h":
            return value * 60 * 60 * 1000;
          case "d":
            return value * 24 * 60 * 60 * 1000;
          default:
            return value * 24 * 60 * 60 * 1000;
        }
      })();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "strict",
        maxAge,
      });

      res
        .status(200)
        .json(
          ResponseBuilder.success("Login successful", { user, accessToken }),
        );
    },
  );

  forgotPassword = asyncHandler(
    async (
      req: Request<unknown, unknown, ForgotPasswordRequest>,
      res: Response,
    ): Promise<void> => {
      const result = await this.authService.forgotPassword(req.body);

      res.status(200).json(ResponseBuilder.success(result.message));
    },
  );

  resendOtp = asyncHandler(
    async (
      req: Request<unknown, unknown, ResendOtpRequest>,
      res: Response,
    ): Promise<void> => {
      const result = await this.authService.resendOtp(req.body);

      res.status(200).json(ResponseBuilder.success(result.message));
    },
  );

  verifyOtp = asyncHandler(
    async (
      req: Request<unknown, unknown, VerifyOtpRequest>,
      res: Response,
    ): Promise<void> => {
      const user = await this.authService.verifyOtp(req.body);

      res
        .status(200)
        .json(ResponseBuilder.success("Account verified successfully", user));
    },
  );

  resetPassword = asyncHandler(
    async (
      req: Request<unknown, unknown, ResetPasswordRequest>,
      res: Response,
    ): Promise<void> => {
      const result = await this.authService.resetPassword(req.body);

      res.status(200).json(ResponseBuilder.success(result.message));
    },
  );
}
