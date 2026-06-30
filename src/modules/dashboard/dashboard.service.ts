import { UserRepository } from "../user/user.repository";
import { WalletTransactionRepository } from "../wallet/wallet.repository";
import { RideRepository } from "../ride/ride.repository";
import type {
  DashboardStatsResponse,
  UserOverviewDataPoint,
  UserOverviewQuery,
  RevenueStatsResponse,
  EarningsTableQuery,
  ReportsAnalyticsStatsResponse,
  ActiveUsersGrowthDataPoint,
} from "./dashboard.types";
import type { RidesOverviewDataPoint } from "./dashboard.types";

export class DashboardService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletTransactionRepo: WalletTransactionRepository,
    private readonly rideRepo: RideRepository,
  ) {}

  /**
   * Retrieves high-level aggregated stats for the admin dashboard top cards
   */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    const earningCriteria = {
      source: { $in: ["COMMISSION"] },
    };

    // Execute all distinct database queries in parallel
    const [totalUsers, totalRiders, totalDrivers, totalEarning] =
      await Promise.all([
        this.userRepository.countDocuments({}),
        this.userRepository.countDocuments({ role: "rider" }),
        this.userRepository.countDocuments({ role: "driver" }),
        this.walletTransactionRepo.calculateTotalAmount(earningCriteria),
      ]);

    return {
      totalEarning,
      totalUsers,
      totalRiders,
      totalDrivers,
    };
  }

  /**
   * Retrieves and formats monthly user overview statistics for the bar chart
   */
  async getUserOverviewStats(
    query: UserOverviewQuery,
  ): Promise<UserOverviewDataPoint[]> {
    const { year, role } = query;

    // Using the aggregation method we built previously
    const stats = await this.userRepository.getUserStatsByYearAndRole(
      year,
      role,
    );

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyData = months.map((month, index) => {
      const monthStat = stats.find((s: any) => s._id === index + 1);
      return {
        name: month,
        user: monthStat ? monthStat.count : 0,
      };
    });

    const maxUserCount = Math.max(...monthlyData.map((d) => d.user), 0);
    const ceiling = maxUserCount > 0 ? Math.ceil(maxUserCount * 1.2) : 100;

    return monthlyData.map((d) => ({
      name: d.name,
      user: d.user,
      diff: ceiling - d.user,
    }));
  }

  /**
   * Retrieves Revenue Stats (Total Revenue & Today's Earning)
   */
  async getRevenueStats(): Promise<RevenueStatsResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const totalCriteria = { source: { $in: ["COMMISSION"] } };
    const todayCriteria = {
      source: { $in: ["COMMISSION"] },
      createdAt: { $gte: today },
    };

    const [totalRevenue, todayEarning] = await Promise.all([
      this.walletTransactionRepo.calculateTotalAmount(totalCriteria),
      this.walletTransactionRepo.calculateTotalAmount(todayCriteria),
    ]);

    return {
      totalRevenue,
      todayEarning,
    };
  }

  /**
   * Retrieves paginated Earnings Table data (Joins Rides with Users)
   */
  async getEarningsTable(query: EarningsTableQuery) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const { items, totalCount } = await this.rideRepo.getEarningsTableData(
      skip,
      limit,
      search,
    );

    return {
      items,
      pagination: {
        // Fixed: Renamed from 'meta' to 'pagination'
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit: limit, // Fixed: Added limit to match other APIs
      },
    };
  }

  // Add this inside DashboardService in src/modules/dashboard/dashboard.service.ts

  /**
   * Retrieves detailed aggregated stats for the Reports Analytics page
   */
  async getReportsAnalyticsStats(): Promise<ReportsAnalyticsStatsResponse> {
    // Run DB queries in parallel
    const [rideStats, activeRiders, activeDrivers, commissionEarned] =
      await Promise.all([
        this.rideRepo.getRideAnalyticsStats(),
        // this.userRepository.countDocuments({ role: "rider", isBlocked: false }),
        // this.userRepository.countDocuments({
        //   role: "driver",
        //   isBlocked: false,
        // }),
        this.userRepository.countDocuments({
          role: "rider",
          isBlocked: { $ne: true },
        }),
        this.userRepository.countDocuments({
          role: "driver",
          isBlocked: { $ne: true },
          adminApproved: "approved", // Only count fully approved drivers
        }),
        this.walletTransactionRepo.calculateTotalAmount({
          source: { $in: ["COMMISSION"] },
        }),
      ]);

    const { totalRides, completedRides, totalRevenue, cancelledRides } =
      rideStats;

    // Calculate derived metrics safely to avoid division by zero
    const completionRate =
      totalRides > 0 ? (completedRides / totalRides) * 100 : 0;
    const averageRideValue =
      completedRides > 0 ? totalRevenue / completedRides : 0;

    return {
      totalRevenue,
      commissionEarned,
      averageRideValue,
      completionRate,
      activeRiders,
      activeDrivers,
      totalRides,
      cancelledRides,
    };
  }

  // Add this inside DashboardService

  /**
   * Retrieves and formats monthly rides overview (completed vs cancelled)
   */
  async getRidesOverviewChartStats(
    year: number,
  ): Promise<RidesOverviewDataPoint[]> {
    const stats = await this.rideRepo.getRidesOverviewByYear(year);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return months.map((month, index) => {
      const monthStat = stats.find((s: any) => s._id === index + 1);
      return {
        month,
        completed: monthStat ? monthStat.completed : 0,
        cancelled: monthStat ? monthStat.cancelled : 0,
      };
    });
  }

  // Add this method inside DashboardService

  /**
   * Retrieves and formats monthly active users (MAU) for the growth chart
   */
  async getActiveUsersGrowthChartStats(
    year: number,
  ): Promise<ActiveUsersGrowthDataPoint[]> {
    const stats = await this.rideRepo.getMonthlyActiveUsers(year);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return months.map((month, index) => {
      // monthIndex matches the 1-12 month output from MongoDB
      const monthStat = stats.find((s: any) => s.monthIndex === index + 1);
      return {
        month,
        activeRiders: monthStat ? monthStat.activeRiders : 0,
        activeDrivers: monthStat ? monthStat.activeDrivers : 0,
      };
    });
  }

  // Add this inside DashboardService

  async getDriverTopUpReport(query: any) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const { items, totalCount } =
      await this.userRepository.getDriverTopUpReportData(skip, limit, search);

    return {
      items,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit: limit,
      },
    };
  }
}
