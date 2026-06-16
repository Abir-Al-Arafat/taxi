// src/modules/voucher/voucher.route.ts
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdminRole } from "../../middlewares/admin.middleware";
import { VoucherController } from "./voucher.controller";
import {
  generateBatchValidation,
  redeemValidation,
  handleValidationErrors,
} from "./voucher.validators";

const router = Router();
const upload = multer();
const controller = new VoucherController();

// -----------------------------------------------------
// 1. ADMIN ENDPOINTS (Strictly requires Admin Role)
// -----------------------------------------------------
const adminRouter = Router();
adminRouter.use(authenticate, requireAdminRole);

adminRouter.post(
  "/generate-batch",
  upload.none(),
  generateBatchValidation,
  handleValidationErrors,
  controller.generateBatch,
);
adminRouter.get("/", controller.listVouchers);
adminRouter.get("/stats", controller.getStats);
adminRouter.get("/batches", controller.listBatches);
adminRouter.get("/code/:code", controller.getVoucherByCode);
adminRouter.put(
  "/:id/status",
  upload.none(),

  controller.updateStatus,
);

router.use("/", adminRouter);

// -----------------------------------------------------
// 2. DRIVER / PUBLIC ENDPOINTS (Standard Auth)
// Note: You requested this under `/api/wallet/top-up`.
// You can map this specific route exactly where you need it inside src/routes/index.ts,
// or export it here for modularity.
// -----------------------------------------------------
export const walletTopUpRouter = Router();
walletTopUpRouter.post(
  "/top-up",
  authenticate,
  redeemValidation,
  handleValidationErrors,
  controller.redeemVoucher,
);

export { router as voucherAdminRouter };
