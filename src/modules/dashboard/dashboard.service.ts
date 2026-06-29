import { UserRepository } from "../user/user.repository";
import { WalletTransactionRepository } from "../wallet/wallet.repository";
import type {
  DashboardStatsResponse,
  UserOverviewDataPoint,
  UserOverviewQuery,
} from "./dashboard.types";

export class DashboardService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletTransactionRepo: WalletTransactionRepository,
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
}
