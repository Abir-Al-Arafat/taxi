import bcrypt from "bcrypt";
import crypto from "crypto";
import { buildAdminPasswordResetEmailTemplate } from "./admin.templates";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { AdminRepository } from "./admin.repository";
import { EmailService } from "../../shared/services/email.service";
import { buildAdminInviteEmailTemplate } from "./admin.templates";
import type { CreateAdminRequest, AdminSchema } from "./admin.types";
import { hashPassword } from "../auth/auth.util";
import { JwtService } from "../../shared/services/jwt.service";
import type {
  IPaginationParams,
  IPaginatedResult,
} from "../../shared/types/pagination.types";
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Creates a new admin user, checks for duplicates, and assigns a temporary password
   */
  async createAdmin(
    request: CreateAdminRequest,
  ): Promise<Partial<AdminSchema>> {
    // 1. Validate business rules (Uniqueness)
    const [existingEmail, existingPhone] = await Promise.all([
      this.adminRepository.findByEmail(request.email),
      this.adminRepository.findByPhone(request.phone),
    ]);

    if (existingEmail)
      throw new AppError("Email already registered", HTTP_STATUS.CONFLICT);
    if (existingPhone)
      throw new AppError(
        "Phone number already registered",
        HTTP_STATUS.CONFLICT,
      );

    // 2. Generate secure temporary password
    const tempPassword = Math.random().toString(36).slice(-10);
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(tempPassword, saltRounds);
    // const passwordHash = await bcrypt.hash(tempPassword, 10);
    // const passwordHash = `hashed_${tempPassword}`; // Placeholder
    // const passwordHash = hashPassword(tempPassword);

    // 3. Persist Admin
    const admin = await this.adminRepository.create({
      ...request,
      passwordHash,
      isActive: true,
    });

    // 4. Send Email Notification
    const emailPayload = buildAdminInviteEmailTemplate({
      name: request.name,
      email: request.email,
      tempPassword,
    });

    const sentMail = await this.emailService.sendEmail({
      to: request.email,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    });

    console.log(`emailPayload ${emailPayload}: sentMail ${sentMail}`);

    // 5. Format response (strip password hash)
    const adminData = admin.toObject ? admin.toObject() : admin;
    delete adminData.passwordHash;

    return adminData;
  }

  async login(email: string, password: string) {
    // 1. Use the new repository method (Fixes the protected model error)
    const admin = await this.adminRepository.findByEmailWithPassword(email);

    if (!admin || !admin.isActive) {
      throw new AppError(
        "Invalid credentials or inactive account",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", HTTP_STATUS.UNAUTHORIZED);
    }

    // 3. Use signAccessToken instead of generateToken (Fixes the JwtService error)
    const accessToken = this.jwtService.signAccessToken({
      userId: admin._id,
      role: admin.role,
      sections: admin.sections,
    });

    // 4. Use destructuring to remove the password (Fixes the delete operator error)
    const adminObj = admin.toObject ? admin.toObject() : admin;
    const { passwordHash, ...safeAdminData } = adminObj;

    return {
      admin: safeAdminData,
      accessToken,
    };
  }

  /**
   * Get all admin staff with pagination, search, sort, and filters
   */
  async getAdmins(
    query: Record<string, any>,
  ): Promise<IPaginatedResult<AdminSchema>> {
    // 1. Extract standard pagination parameters
    const paginationParams: IPaginationParams = {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 10,
      sort: query.sort ? String(query.sort) : "-createdAt",
      search: query.search ? String(query.search) : "",
    };

    // 2. Build target filter for specific fields
    const targetFilter: Record<string, any> = {};

    // Filter by active status
    if (query.isActive !== undefined) {
      targetFilter.isActive =
        query.isActive === "true" || query.isActive === true;
    }

    // Filter by specific role
    if (query.role) {
      targetFilter.role = query.role;
    }

    // Filter by specific section access (if they have access to at least this section)
    if (query.section) {
      targetFilter.sections = { $in: [query.section] };
    }

    // 3. Define fields that the global search will look through
    const searchableFields = ["name", "email", "phone"];

    // 4. Fetch paginated results via the BaseRepository
    const result = await this.adminRepository.findPaginated(
      paginationParams,
      targetFilter,
      searchableFields,
    );

    return result;
  }

  /**
   * Step 1: Request Password Reset
   */
  async forgotPassword(email: string): Promise<void> {
    const admin = await this.adminRepository.findByEmail(email);

    // Security best practice: Do not throw an error if the email is not found.
    // Just return silently to prevent email enumeration attacks.
    if (!admin || !admin.isActive) return;

    // 1. Generate a 4 or 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

    // 2. Hash it before saving (SHA-256 is fine for OTPs)
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 3. Save hash to admin document
    await this.adminRepository.updateAdminRecord(admin._id, {
      passwordResetTokenHash: otpHash,
      passwordResetTokenExpiresAt: expiresAt,
    });

    // 4. Send the raw OTP via email
    const emailPayload = buildAdminPasswordResetEmailTemplate(admin.name, otp);
    await this.emailService.sendEmail({
      to: admin.email,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    });
  }

  /**
   * Step 2: Verify the OTP
   */
  async verifyPasswordResetOtp(email: string, otp: string): Promise<void> {
    const admin = await this.adminRepository.findByEmailWithResetTokens(email);

    if (!admin || !admin.isActive) {
      throw new AppError("Invalid request", HTTP_STATUS.BAD_REQUEST);
    }

    if (!admin.passwordResetTokenHash || !admin.passwordResetTokenExpiresAt) {
      throw new AppError(
        "No password reset requested",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (admin.passwordResetTokenExpiresAt < new Date()) {
      throw new AppError("Reset code has expired", HTTP_STATUS.BAD_REQUEST);
    }

    // Verify OTP Hash
    const incomingOtpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    if (incomingOtpHash !== admin.passwordResetTokenHash) {
      throw new AppError("Invalid reset code", HTTP_STATUS.BAD_REQUEST);
    }

    // Mark as verified by setting the verifiedAt timestamp
    await this.adminRepository.updateAdminRecord(admin._id, {
      passwordResetTokenVerifiedAt: new Date(),
    });
  }

  /**
   * Step 3: Set New Password
   */
  async resetPassword(
    email: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    if (newPassword !== confirmPassword) {
      throw new AppError("Passwords do not match", HTTP_STATUS.BAD_REQUEST);
    }

    const admin = await this.adminRepository.findByEmailWithResetTokens(email);

    if (!admin || !admin.isActive) {
      throw new AppError("Invalid request", HTTP_STATUS.BAD_REQUEST);
    }

    // Ensure the OTP was successfully verified
    if (!admin.passwordResetTokenVerifiedAt) {
      throw new AppError("Please verify your OTP first", HTTP_STATUS.FORBIDDEN);
    }

    // Security Check: Ensure they reset the password within 15 minutes of verifying the OTP
    const sessionExpirationTime = new Date(
      admin.passwordResetTokenVerifiedAt.getTime() + 15 * 60 * 1000,
    );
    if (sessionExpirationTime < new Date()) {
      throw new AppError(
        "Reset session expired. Please request a new code.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Hash the new password with bcrypt
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Save new password and clear all reset token fields
    await this.adminRepository.updateAdminRecord(admin._id, {
      passwordHash: newPasswordHash,
      $unset: {
        passwordResetTokenHash: 1,
        passwordResetTokenExpiresAt: 1,
        passwordResetTokenVerifiedAt: 1,
      },
    });
  }

  async getAdminById(adminId: string): Promise<Partial<AdminSchema> | null> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) return null;

    const adminData = admin.toObject ? admin.toObject() : admin;
    delete adminData.passwordHash;
    delete adminData.__v;

    return adminData;
  }
}
