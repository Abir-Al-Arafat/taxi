// src/modules/ride/ride.route.ts
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.middleware";
// Add requireRole middleware if you have one for strict driver/rider routing
import { RideController } from "./ride.controller";

import "./ride.events";

const router = Router();
const upload = multer();
const controller = new RideController();

router.use(authenticate);

// Rider actions
router.post("/estimate", upload.none(), controller.estimate);
router.post("/request", upload.none(), controller.request);
router.post("/:rideId/pay", upload.none(), controller.pay);

// Driver actions
router.get("/nearby", upload.none(), controller.getNearby);
router.post("/:rideId/accept", upload.none(), controller.accept);
router.patch("/:rideId/status", upload.none(), controller.updateStatus); // Body: { action: 'arrived' }

export { router as rideRouter };
