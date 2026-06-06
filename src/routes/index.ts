import { Router } from "express";
import { authRouter } from "../modules/auth/auth.route";
import { driverProfileRouter } from "../modules/driver-profile/driver-profile.route";

const router = Router();

router.use("/auth", authRouter);
router.use("/driver-profile", driverProfileRouter);

export { router as apiRouter };
