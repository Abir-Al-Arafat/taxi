import type { AuthRole } from "../auth/auth.types";

export interface DashboardStatsResponse {
  totalEarning: number;
  totalUsers: number;
  totalRiders: number;
  totalDrivers: number;
}

export interface UserOverviewDataPoint {
  name: string; // Month name (e.g., "Jan")
  user: number; // Count
  diff: number; // Difference to ceiling (for stacked chart)
}

export interface UserOverviewQuery {
  year: number;
  role: AuthRole;
}

export interface RevenueStatsResponse {
  totalRevenue: number;
  todayEarning: number;
}

export interface EarningsTableQuery {
  page: number;
  limit: number;
  search?: string | undefined;
}

export interface ReportsAnalyticsStatsResponse {
  totalRevenue: number;
  commissionEarned: number;
  averageRideValue: number;
  completionRate: number;
  activeRiders: number;
  activeDrivers: number;
  totalRides: number;
  cancelledRides: number;
}

export interface RidesOverviewDataPoint {
  month: string;
  completed: number;
  cancelled: number;
}

export interface ActiveUsersGrowthDataPoint {
  month: string;
  activeDrivers: number;
  activeRiders: number;
}
