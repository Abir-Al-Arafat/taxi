import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { UserRepository } from "../user/user.repository";
import { WalletTransactionRepository } from "../wallet/wallet.repository";
import { RideRepository } from "../ride/ride.repository";
import { VoucherRepository } from "../voucher/voucher.repository";
// Import auth/admin middlewares if you have them ready
// import { authMiddleware } from "../../middlewares/auth.middleware";
// import { adminMiddleware } from "../../middlewares/admin.middleware";

const router = Router();

// Instantiate dependencies
const userRepository = new UserRepository();
const walletTransactionRepo = new WalletTransactionRepository();
const voucherRepo = new VoucherRepository();
const rideRepository = new RideRepository();
const dashboardService = new DashboardService(
  userRepository,
  walletTransactionRepo,
  rideRepository,
  voucherRepo,
);

const dashboardController = new DashboardController(dashboardService);

// Mount routes (Note: Consider adding authMiddleware and adminMiddleware here)
router.get(
  "/stats",
  // authMiddleware, adminMiddleware,
  dashboardController.getStats,
);

router.get(
  "/user-overview",
  // authMiddleware, adminMiddleware,
  dashboardController.getUserOverview,
);

router.get("/revenue-stats", dashboardController.getRevenueStats);
router.get("/earnings-table", dashboardController.getEarningsTable);
router.get(
  "/reports-analytics-stats",
  dashboardController.getReportsAnalyticsStats,
);
router.get("/rides-overview-chart", dashboardController.getRidesOverviewChart);
// Add this to the router mapping in src/modules/dashboard/dashboard.route.ts
router.get(
  "/active-users-growth-chart",
  dashboardController.getActiveUsersGrowthChart,
);
router.get("/driver-topup-report", dashboardController.getDriverTopUpReport);
router.get("/voucher-usage-report", dashboardController.getVoucherUsageReport);
export { router as dashboardRouter };
