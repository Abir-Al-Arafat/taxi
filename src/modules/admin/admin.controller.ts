import type { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import HTTP_STATUS from "../../constants/statusCodes";
import { AdminService } from "./admin.service";
import { ActivityService } from "../activity/activity.service";
import { AppError } from "../../core/errors/AppError";

export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly activityService: ActivityService,
  ) {}

  /**
   * Create new admin staff
   * POST /api/v1/admins
   */
  createAdmin = asyncHandler(async (req: Request, res: Response) => {
    const admin = await this.adminService.createAdmin(req.body);

    res
      .status(HTTP_STATUS.CREATED)
      .json(
        ResponseBuilder.success(
          "Admin staff created successfully",
          admin,
          HTTP_STATUS.CREATED,
        ),
      );
  });

  deleteAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { adminId } = req.params;

    if (!adminId) {
      throw new AppError("Admin ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    await this.adminService.deleteAdmin(adminId as string);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Admin staff deleted successfully",
          null,
          HTTP_STATUS.OK,
        ),
      );
  });

  /**
   * Admin Login
   * POST /api/v1/admins/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(
        "Email and password are required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await this.adminService.login(email, password);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Admin logged in successfully",
          result,
          HTTP_STATUS.OK,
        ),
      );
  });

  /**
   * Get paginated admin staff
   * GET /api/v1/admins
   */
  getAdmins = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.adminService.getAdmins(req.query);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Admin staff retrieved successfully",
          result,
          HTTP_STATUS.OK,
        ),
      );
  });

  getAdminById = asyncHandler(async (req: Request, res: Response) => {
    const { adminId } = req.params;

    if (!adminId) {
      throw new AppError("Admin ID is required", HTTP_STATUS.BAD_REQUEST);
    }

    const admin = await this.adminService.getAdminById(adminId as string);

    if (!admin) {
      throw new AppError("Admin not found", HTTP_STATUS.NOT_FOUND);
    }

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Admin details retrieved successfully",
          admin,
          HTTP_STATUS.OK,
        ),
      );
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email)
      throw new AppError("Email is required", HTTP_STATUS.BAD_REQUEST);

    await this.adminService.forgotPassword(email);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "If the email exists, a reset code has been sent",
          null,
          HTTP_STATUS.OK,
        ),
      );
  });

  verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError("Email and OTP are required", HTTP_STATUS.BAD_REQUEST);
    }

    await this.adminService.verifyPasswordResetOtp(email, otp);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "OTP verified successfully",
          null,
          HTTP_STATUS.OK,
        ),
      );
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      throw new AppError(
        "Email, new password, and confirm password are required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    await this.adminService.resetPassword(email, newPassword, confirmPassword);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Password has been reset successfully",
          null,
          HTTP_STATUS.OK,
        ),
      );
  });

  getAdminActivities = asyncHandler(async (req: Request, res: Response) => {
    const { adminId } = req.params;

    // Call generic service specifying "Admin"
    const result = await this.activityService.getActivitiesForActor(
      adminId as string,
      "Admin",
      req.query,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success("Activities retrieved", result, HTTP_STATUS.OK),
      );
  });
}
