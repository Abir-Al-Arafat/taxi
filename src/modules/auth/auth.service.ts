import {
  createHash,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";
import { EmailService } from "../../shared/services/email.service";
import { AuthRepository } from "./auth.repository";
import {
  buildPasswordResetEmailTemplate,
  buildPasswordResetSmsTemplate,
  buildVerificationEmailTemplate,
  buildVerificationSmsTemplate,
} from "./auth.templates";
import type {
  AuthUserResponse,
  AuthLocationInput,
  AuthLocationPoint,
  AuthLocationResponse,
  AuthUserView,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
  SignupRequest,
  VerifyOtpRequest,
} from "./auth.types";
import type { AuthUserDocument } from "./user.schema";
import { env } from "../../config/env";

const OTP_EXPIRATION_MINUTES = 10;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_HASH_LENGTH = 64;

export class AuthService {
  private readonly emailService = new EmailService();

  constructor(private readonly authRepository = new AuthRepository()) {}

  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = this.createExpiryFromDuration(env.jwtRefreshExpiresIn);

    await this.authRepository.saveRefreshToken(
      userId,
      refreshTokenHash,
      expiresAt,
    );
  }

  async signup(request: SignupRequest): Promise<AuthUserResponse> {
    const email = this.normalizeEmail(request.email);
    const phoneNumber = this.normalizePhoneNumber(request.phoneNumber);

    const existingUser = await this.authRepository.findByEmailOrPhoneNumber(
      email,
      phoneNumber,
    );

    if (existingUser) {
      throw new AppError(
        "Email or phone number already registered",
        HTTP_STATUS.CONFLICT,
      );
    }

    const passwordHash = this.hashPassword(request.password);
    const verificationOtp = this.generateOtp();
    const verificationTokenHash = this.hashToken(verificationOtp);
    const verificationTokenExpiresAt = this.createExpirationDate();
    const locationAddress = this.normalizeLocationAddress(request.location);
    const createPayload: Parameters<AuthRepository["createUser"]>[0] = {
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      phoneNumber,
      email,
      location: this.normalizeLocation(request.location),
      gender: request.gender,
      role: request.role,
      passwordHash,
      isVerified: false,
      verificationTokenHash,
      verificationTokenExpiresAt,
    };

    if (typeof locationAddress !== "undefined") {
      createPayload.locationAddress = locationAddress;
    }

    const user = await this.authRepository.createUser(createPayload);

    await this.sendVerificationMessage(user, verificationOtp);

    return this.mapUserToResponse(user);
  }

  async login(request: LoginRequest): Promise<AuthUserResponse> {
    const phoneNumber = this.normalizePhoneNumber(request.phoneNumber);
    const user =
      await this.authRepository.findByPhoneNumberWithSecrets(phoneNumber);

    if (!user) {
      throw new AppError(
        "Invalid phone number or password",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (!user.isVerified) {
      throw new AppError("Account is not verified yet", HTTP_STATUS.FORBIDDEN);
    }

    if (!this.verifyPassword(request.password, user.passwordHash)) {
      throw new AppError(
        "Invalid phone number or password",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    return this.mapUserToResponse(user);
  }

  async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<{ message: string }> {
    const phoneNumber = this.normalizePhoneNumber(request.phoneNumber);
    const user = await this.authRepository.findByPhoneNumber(phoneNumber);

    if (!user) {
      return {
        message:
          "If an account exists for this phone number, a reset code has been sent",
      };
    }

    const resetOtp = this.generateOtp();
    const passwordResetTokenHash = this.hashToken(resetOtp);
    const passwordResetTokenExpiresAt = this.createExpirationDate();

    await this.authRepository.updateOne(
      { _id: user._id },
      {
        passwordResetTokenHash,
        passwordResetTokenExpiresAt,
      },
    );

    await this.sendPasswordResetMessage(user, resetOtp);

    return {
      message:
        "If an account exists for this phone number, a reset code has been sent",
    };
  }

  async resendOtp(request: ResendOtpRequest): Promise<{ message: string }> {
    const phoneNumber = this.normalizePhoneNumber(request.phoneNumber);
    const user = await this.authRepository.findByPhoneNumber(phoneNumber);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    if (user.isVerified) {
      throw new AppError("Account is already verified", HTTP_STATUS.CONFLICT);
    }

    const verificationOtp = this.generateOtp();
    const verificationTokenHash = this.hashToken(verificationOtp);
    const verificationTokenExpiresAt = this.createExpirationDate();

    await this.authRepository.updateOne(
      { _id: user._id },
      {
        verificationTokenHash,
        verificationTokenExpiresAt,
      },
    );

    await this.sendVerificationMessage(user, verificationOtp);

    return {
      message: "Verification code resent successfully",
    };
  }

  async verifyOtp(request: VerifyOtpRequest): Promise<AuthUserResponse> {
    const phoneNumber = this.normalizePhoneNumber(request.phoneNumber);
    const user =
      await this.authRepository.findByPhoneNumberWithSecrets(phoneNumber);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    this.assertTokenIsValid(
      user.verificationTokenHash,
      user.verificationTokenExpiresAt,
      request.otp,
    );

    const updatedUser = await this.authRepository.updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          verifiedAt: new Date(),
        },
        $unset: {
          verificationTokenHash: "",
          verificationTokenExpiresAt: "",
        },
      },
    );

    if (!updatedUser) {
      throw new AppError(
        "Failed to verify account",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return this.mapUserToResponse(updatedUser);
  }

  async resetPassword(
    request: ResetPasswordRequest,
  ): Promise<{ message: string }> {
    const phoneNumber = this.normalizePhoneNumber(request.phoneNumber);
    const user =
      await this.authRepository.findByPhoneNumberWithSecrets(phoneNumber);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    this.assertTokenIsValid(
      user.passwordResetTokenHash,
      user.passwordResetTokenExpiresAt,
      request.otp,
    );

    const passwordHash = this.hashPassword(request.password);

    const updatedUser = await this.authRepository.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
        },
        $unset: {
          passwordResetTokenHash: "",
          passwordResetTokenExpiresAt: "",
        },
      },
    );

    if (!updatedUser) {
      throw new AppError(
        "Failed to reset password",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      message: "Password reset successfully",
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.trim().replace(/[\s-]/g, "");
  }

  private normalizeLocation(location: AuthLocationInput): AuthLocationPoint {
    return {
      type: "Point",
      coordinates: [location.lng, location.lat],
    };
  }

  private normalizeLocationAddress(
    location: AuthLocationInput,
  ): string | undefined {
    if (typeof location.address !== "string") {
      return undefined;
    }

    const normalizedAddress = location.address.trim();

    return normalizedAddress.length > 0 ? normalizedAddress : undefined;
  }

  private generateOtp(): string {
    return String(randomInt(1000, 10000));
  }

  private createExpirationDate(): Date {
    return new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private createExpiryFromDuration(duration: string): Date {
    // Supports simple durations like '30d', '15m', '2h', '45s'
    const m = duration.match(/^(\d+)([smhd])$/);
    if (!m) {
      // fallback to 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const value = Number(m[1]);
    const unit = m[2];

    let ms = 0;
    switch (unit) {
      case "s":
        ms = value * 1000;
        break;
      case "m":
        ms = value * 60 * 1000;
        break;
      case "h":
        ms = value * 60 * 60 * 1000;
        break;
      case "d":
        ms = value * 24 * 60 * 60 * 1000;
        break;
      default:
        ms = value * 24 * 60 * 60 * 1000;
    }

    return new Date(Date.now() + ms);
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(PASSWORD_SALT_BYTES).toString("hex");
    const derivedKey = scryptSync(
      password,
      salt,
      PASSWORD_HASH_LENGTH,
    ).toString("hex");

    return `${salt}:${derivedKey}`;
  }

  private verifyPassword(
    password: string,
    storedPasswordHash: string,
  ): boolean {
    const [salt, key] = storedPasswordHash.split(":");

    if (!salt || !key) {
      return false;
    }

    const hashedPassword = scryptSync(password, salt, PASSWORD_HASH_LENGTH);
    const storedKey = Buffer.from(key, "hex");

    if (hashedPassword.length !== storedKey.length) {
      return false;
    }

    return timingSafeEqual(hashedPassword, storedKey);
  }

  private assertTokenIsValid(
    storedTokenHash: string | undefined,
    expiresAt: Date | undefined,
    token: string,
  ): void {
    if (!storedTokenHash || !expiresAt) {
      throw new AppError("Invalid or expired code", HTTP_STATUS.BAD_REQUEST);
    }

    if (expiresAt.getTime() < Date.now()) {
      throw new AppError("Code has expired", HTTP_STATUS.BAD_REQUEST);
    }

    if (this.hashToken(token) !== storedTokenHash) {
      throw new AppError("Invalid code", HTTP_STATUS.BAD_REQUEST);
    }
  }

  private async sendVerificationMessage(
    user: AuthUserDocument,
    otp: string,
  ): Promise<void> {
    const userView = this.mapUserToView(user);
    const emailTemplate = buildVerificationEmailTemplate({
      user: userView,
      otp,
    });

    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });
    } catch (error) {
      console.error("Failed to send verification email", error);
    }
  }

  private async sendPasswordResetMessage(
    user: AuthUserDocument,
    otp: string,
  ): Promise<void> {
    const userView = this.mapUserToView(user);
    const emailTemplate = buildPasswordResetEmailTemplate({
      user: userView,
      otp,
    });

    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });
    } catch (error) {
      console.error("Failed to send password reset email", error);
    }
  }

  private mapUserToView(user: AuthUserDocument): AuthUserView {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      phoneNumber: user.phoneNumber,
      email: user.email,
      location: this.mapLocationToResponse(user.location, user.locationAddress),
      gender: user.gender,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapLocationToResponse(
    location: AuthLocationPoint,
    locationAddress?: string,
  ): AuthLocationResponse {
    return {
      lat: location.coordinates[1],
      lng: location.coordinates[0],
      ...(locationAddress ? { address: locationAddress } : {}),
    };
  }

  private mapUserToResponse(user: AuthUserDocument): AuthUserResponse {
    return this.mapUserToView(user);
  }
}
