import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { AdminRepository } from "./admin.repository";
import type { CreateAdminRequest, AdminSchema } from "./admin.types";
import { hashPassword } from "../auth/auth.util";
// import bcrypt from "bcrypt";
// import { EmailService } from "../../shared/services/email.service";

export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    // private readonly emailService: EmailService
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
    // const passwordHash = await bcrypt.hash(tempPassword, 10);
    // const passwordHash = `hashed_${tempPassword}`; // Placeholder
    const passwordHash = hashPassword(tempPassword);

    // 3. Persist Admin
    const admin = await this.adminRepository.create({
      ...request,
      passwordHash,
      isActive: true,
    });

    // 4. Trigger side effect (Send email with temp password)
    // await this.emailService.sendAdminInvite(admin.email, tempPassword);

    // 5. Format response (strip password hash)
    const adminData = admin.toObject ? admin.toObject() : admin;
    delete adminData.passwordHash;

    return adminData;
  }
}
