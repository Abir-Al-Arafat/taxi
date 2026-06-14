import { Router } from "express";
import { authRouter } from "../modules/auth/auth.route";
import { userRouter } from "../modules/user/user.route";
import { driverProfileRouter } from "../modules/driver-profile/driver-profile.route";
import { driverApprovalRouter } from "../modules/driver-approval/driver-approval.route";
import { savedPlaceRouter } from "../modules/saved-place/saved-place.route";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/saved-places", savedPlaceRouter);
router.use("/driver-profile", driverProfileRouter);
router.use("/driver-approval", driverApprovalRouter);

export { router as apiRouter };
