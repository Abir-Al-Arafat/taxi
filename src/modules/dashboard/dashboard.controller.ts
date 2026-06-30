import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import { DashboardService } from "./dashboard.service";
import type { AuthRole } from "../auth/auth.types";

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/v1/dashboard/stats
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.dashboardService.getDashboardStats();

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Dashboard stats retrieved successfully",
          stats,
          HTTP_STATUS.OK,
        ),
      );
  });

  /**
   * GET /api/v1/dashboard/user-overview?year=2024&role=rider
   */
  getUserOverview = asyncHandler(async (req: Request, res: Response) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const role = (req.query.role as string)?.toLowerCase() || "rider";

    if (role !== "rider" && role !== "driver") {
      throw new AppError(
        "Invalid role. Must be 'rider' or 'driver'",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new AppError("Invalid year provided", HTTP_STATUS.BAD_REQUEST);
    }

    const overviewData = await this.dashboardService.getUserOverviewStats({
      year,
      role: role as AuthRole,
    });

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "User overview retrieved successfully",
          overviewData,
          HTTP_STATUS.OK,
        ),
      );
  });

  /**
   * GET /api/v1/dashboard/revenue-stats
   */
  getRevenueStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.dashboardService.getRevenueStats();

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Revenue stats retrieved successfully",
          stats,
          HTTP_STATUS.OK,
        ),
      );
  });

  /**
   * GET /api/v1/dashboard/earnings-table?page=1&limit=10
   */
  getEarningsTable = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;

    const tableData = await this.dashboardService.getEarningsTable({
      page,
      limit,
      search,
    });

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Earnings table retrieved successfully",
          tableData,
          HTTP_STATUS.OK,
        ),
      );
  });

  // Add this inside DashboardController in src/modules/dashboard/dashboard.controller.ts

  /**
   * GET /api/v1/dashboard/reports-analytics-stats
   */
  getReportsAnalyticsStats = asyncHandler(
    async (req: Request, res: Response) => {
      const stats = await this.dashboardService.getReportsAnalyticsStats();

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Reports analytics stats retrieved successfully",
            stats,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  // Add this inside DashboardController

  /**
   * GET /api/v1/dashboard/rides-overview-chart?year=2026
   */
  getRidesOverviewChart = asyncHandler(async (req: Request, res: Response) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new AppError("Invalid year provided", HTTP_STATUS.BAD_REQUEST);
    }

    const chartData =
      await this.dashboardService.getRidesOverviewChartStats(year);

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Rides overview chart retrieved successfully",
          chartData,
          HTTP_STATUS.OK,
        ),
      );
  });

  // Add this inside DashboardController

  /**
   * GET /api/v1/dashboard/active-users-growth-chart?year=2026
   */
  getActiveUsersGrowthChart = asyncHandler(
    async (req: Request, res: Response) => {
      const year =
        parseInt(req.query.year as string) || new Date().getFullYear();

      if (isNaN(year) || year < 2000 || year > 2100) {
        throw new AppError("Invalid year provided", HTTP_STATUS.BAD_REQUEST);
      }

      const chartData =
        await this.dashboardService.getActiveUsersGrowthChartStats(year);

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Active users growth chart retrieved successfully",
            chartData,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  /**
   * GET /api/v1/dashboard/driver-topup-report
   */
  getDriverTopUpReport = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;

    const reportData = await this.dashboardService.getDriverTopUpReport({
      page,
      limit,
      search,
    });

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Driver report retrieved successfully",
          reportData,
          HTTP_STATUS.OK,
        ),
      );
  });
}
