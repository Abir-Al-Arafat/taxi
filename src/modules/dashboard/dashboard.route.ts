import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { UserRepository } from "../user/user.repository";
import { WalletTransactionRepository } from "../wallet/wallet.repository";
import { RideRepository } from "../ride/ride.repository";
// Import auth/admin middlewares if you have them ready
// import { authMiddleware } from "../../middlewares/auth.middleware";
// import { adminMiddleware } from "../../middlewares/admin.middleware";

const router = Router();

// Instantiate dependencies
const userRepository = new UserRepository();
const walletTransactionRepo = new WalletTransactionRepository();
const rideRepository = new RideRepository();
const dashboardService = new DashboardService(
  userRepository,
  walletTransactionRepo,
  rideRepository,
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

export { router as dashboardRouter };
