import type { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import HTTP_STATUS from "../../constants/statusCodes";
import { AdminService } from "./admin.service";

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
}
