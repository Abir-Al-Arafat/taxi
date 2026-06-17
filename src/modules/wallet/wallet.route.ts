// src/modules/wallet/wallet.route.ts
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { WalletController } from "./wallet.controller";
import {
  redeemValidation,
  handleValidationErrors,
} from "../voucher/voucher.validators"; // Reusing Voucher validation maps

const router = Router();
const upload = multer();
const controller = new WalletController();

// All wallet endpoints strictly belong to authenticated users
router.use(authenticate);

router.get("/balance", controller.getMyBalance);
router.get("/transactions", controller.getMyTransactions);
router.post(
  "/top-up",
  upload.none(),
  redeemValidation,
  handleValidationErrors,

  controller.topUpWithVoucher,
);

export { router as walletRouter };
