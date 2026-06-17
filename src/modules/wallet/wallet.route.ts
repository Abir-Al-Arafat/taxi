// src/modules/wallet/wallet.route.ts
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdminRole } from "../../middlewares/admin.middleware";
import { WalletController } from "./wallet.controller";
import {
  redeemValidation,
  handleValidationErrors as voucherValidationErrors,
} from "../voucher/voucher.validators";
import {
  adminWalletAdjustmentValidation,
  handleValidationErrors as walletValidationErrors,
} from "./wallet.validators";

const router = Router();
const upload = multer();
const controller = new WalletController();

// -----------------------------------------------------
// 1. ADMIN ENDPOINTS
// -----------------------------------------------------
const adminRouter = Router();
adminRouter.use(authenticate, requireAdminRole);

adminRouter.get("/dashboard", controller.getWalletDashboard);

adminRouter.get("/transactions", controller.getGlobalTransactions);

adminRouter.post(
  "/top-up",
  upload.none(),
  adminWalletAdjustmentValidation,
  walletValidationErrors,
  controller.adminTopUp,
);
adminRouter.post(
  "/deduct",
  upload.none(),
  adminWalletAdjustmentValidation,
  walletValidationErrors,
  controller.adminDeduct,
);

router.use("/admin", adminRouter);

// -----------------------------------------------------
// 2. DRIVER ENDPOINTS
// -----------------------------------------------------
const driverRouter = Router();
driverRouter.use(authenticate);

driverRouter.get("/balance", controller.getMyBalance);
driverRouter.get("/transactions", controller.getMyTransactions);
driverRouter.post(
  "/top-up",
  upload.none(),
  redeemValidation,
  voucherValidationErrors,
  controller.topUpWithVoucher,
);

router.use("/", driverRouter);

export { router as walletRouter };
