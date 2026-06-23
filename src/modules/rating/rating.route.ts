import { Router } from "express";
import multer from "multer";

import { RatingRepository } from "./rating.repository";
import { RatingService } from "./rating.service";
import { RatingController } from "./rating.controller";

import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const upload = multer();

// Dependency Injection Setup
const repository = new RatingRepository();
const service = new RatingService(repository);
const controller = new RatingController(service);

router.post("/", authenticate, upload.none(), controller.submitRating);

router.get("/me", authenticate, controller.getMyRatings);

router.get(
  "/driver/:driverId",
  authenticate,
  upload.none(),
  controller.getDriverRatings,
);

export { router as ratingRouter };
