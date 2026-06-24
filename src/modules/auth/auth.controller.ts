import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { jwtExpiresInToMs } from "../../shared/utilities/time.util";
import { AuthService } from "./auth.service";
import { JwtService } from "../../shared/services/jwt.service";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
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
      const deliveryTarget =
        env.otpDeliveryMethod === "sms" ? "phone number" : "email";
      res
        .status(HTTP_STATUS.CREATED)
        .json(
          ResponseBuilder.success(
            `Account created successfully. Verification code sent to ${deliveryTarget}.`,
            user,
            HTTP_STATUS.CREATED,
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
        userId: user.id,
        role: user.role,
      });
      const refreshToken = this.jwtService.signRefreshToken({ sub: user.id });

      // Persist hashed refresh token
      await this.authService.saveRefreshToken(user.id, refreshToken);

      // Compute maxAge
      const maxAge = jwtExpiresInToMs(env.jwtRefreshExpiresIn);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "strict",
        maxAge,
      });

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Login successful",
            { user, accessToken },
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  forgotPassword = asyncHandler(
    async (
      req: Request<unknown, unknown, ForgotPasswordRequest>,
      res: Response,
    ): Promise<void> => {
      const result = await this.authService.forgotPassword(req.body);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(result.message, undefined, HTTP_STATUS.OK),
        );
    },
  );

  resendOtp = asyncHandler(
    async (
      req: Request<unknown, unknown, ResendOtpRequest>,
      res: Response,
    ): Promise<void> => {
      const result = await this.authService.resendOtp(req.body);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(result.message, undefined, HTTP_STATUS.OK),
        );
    },
  );

  verifyOtp = asyncHandler(
    async (
      req: Request<unknown, unknown, VerifyOtpRequest>,
      res: Response,
    ): Promise<void> => {
      const result = await this.authService.verifyOtp(req.body);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(result.message, result.user, HTTP_STATUS.OK),
        );
    },
  );

  resetPassword = asyncHandler(
    async (
      req: Request<unknown, unknown, ResetPasswordRequest>,
      res: Response,
    ): Promise<void> => {
      const result = await this.authService.resetPassword(req.body);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(result.message, undefined, HTTP_STATUS.OK),
        );
    },
  );

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    const refreshToken = authReq.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new AppError("Refresh token not found", HTTP_STATUS.UNAUTHORIZED);
    }

    let decodedRefresh: { sub: string };

    try {
      // 1. Verify the refresh token
      // Passing true or the appropriate parameter for refresh verification based on  jwtService setup
      decodedRefresh = this.jwtService.verify<{ sub: string }>(
        refreshToken as string,
        true,
      );
    } catch (error) {
      throw new AppError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
    }

    const userId = decodedRefresh.sub; // Extracts the user identity directly from the refresh payload

    if (!userId) {
      throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await this.authService.refresh(userId, refreshToken);

    // Issue new access token
    const accessToken = this.jwtService.signAccessToken({
      userId: user.id,
      role: user.role,
    });

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Token refreshed successfully",
          { user, accessToken },
          HTTP_STATUS.OK,
        ),
      );
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId as string | undefined;

    if (!userId) {
      throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
    }

    await this.authService.logout(userId);

    res.clearCookie("refreshToken");

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Logged out successfully",
          undefined,
          HTTP_STATUS.OK,
        ),
      );
  });
}
