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
