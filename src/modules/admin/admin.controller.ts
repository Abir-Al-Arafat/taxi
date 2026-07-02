import type { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import HTTP_STATUS from "../../constants/statusCodes";
import { AdminService } from "./admin.service";
import { AppError } from "../../core/errors/AppError";

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
}
