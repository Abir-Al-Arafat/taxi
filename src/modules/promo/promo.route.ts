// src/modules/promo/promo.route.ts
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireAdminRole } from "../../middlewares/admin.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { PromoController } from "./promo.controller";
import {
  createPromoValidation,
  applyPromoValidation,
  handleValidationErrors,
} from "./promo.validators";

const router = Router();
const upload = multer();
const controller = new PromoController();

// -----------------------------------------------------
// 1. ADMIN ENDPOINTS
// -----------------------------------------------------
const adminRouter = Router();
adminRouter.use(authenticate, authorizeRoles("admin"));

adminRouter.post(
  "/create",
  upload.none(),
  createPromoValidation,
  handleValidationErrors,
  controller.createPromo,
);
adminRouter.put(
  "/update/:id",
  upload.none(),
  createPromoValidation,
  handleValidationErrors,
  controller.updatePromo,
);
adminRouter.patch("/toggle-status/:id", controller.togglePromoStatus);
adminRouter.get("/list", controller.listAllPromos);
adminRouter.get("/stats", controller.getPromoStats);
adminRouter.get("/:id", controller.getPromoDetails);

router.use("/admin", adminRouter);

// -----------------------------------------------------
// 2. USER (Rider/Driver) ENDPOINTS
// -----------------------------------------------------
const userRouter = Router();
userRouter.use(authenticate);

userRouter.get("/available", controller.getAvailablePromos);
userRouter.post(
  "/apply",
  upload.none(),
  applyPromoValidation,
  handleValidationErrors,
  controller.applyPromo,
);

router.use("/", userRouter);

export { router as promoRouter };
