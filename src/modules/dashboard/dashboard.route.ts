import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { UserRepository } from "../user/user.repository";
import { WalletTransactionRepository } from "../wallet/wallet.repository";
// Import auth/admin middlewares if you have them ready
// import { authMiddleware } from "../../middlewares/auth.middleware";
// import { adminMiddleware } from "../../middlewares/admin.middleware";

const router = Router();

// Instantiate dependencies
const userRepository = new UserRepository();
const walletTransactionRepo = new WalletTransactionRepository();
const dashboardService = new DashboardService(
  userRepository,
  walletTransactionRepo,
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

export { router as dashboardRouter };
