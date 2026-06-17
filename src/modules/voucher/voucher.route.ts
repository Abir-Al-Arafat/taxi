// src/modules/voucher/voucher.route.ts
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdminRole } from "../../middlewares/admin.middleware";
import { VoucherController } from "./voucher.controller";
import {
  generateBatchValidation,
  handleValidationErrors,
} from "./voucher.validators";

const router = Router();
const upload = multer();
const controller = new VoucherController();

// -----------------------------------------------------
// 1. ADMIN ENDPOINTS (Strictly requires Admin Role)
// -----------------------------------------------------

router.use(authenticate, requireAdminRole);

router.post(
  "/generate-batch",
  upload.none(),
  generateBatchValidation,
  handleValidationErrors,
  controller.generateBatch,
);
router.get("/", controller.listVouchers);
router.get("/stats", controller.getStats);
router.get("/batches", controller.listBatches);
router.get("/code/:code", controller.getVoucherByCode);
router.put(
  "/:id/status",
  upload.none(),

  controller.updateStatus,
);

export { router as voucherRouter };
