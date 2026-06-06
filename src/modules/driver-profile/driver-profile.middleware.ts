import type { NextFunction, Response } from "express";
import HTTP_STATUS from "../../constants/statusCodes";
import { AppError } from "../../core/errors/AppError";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { AuthRepository } from "../auth/auth.repository";

const authRepository = new AuthRepository();

export const requireDriverRole = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== "driver") {
    next(
      new AppError(
        "Only drivers can access this resource",
        HTTP_STATUS.FORBIDDEN,
      ),
    );
    return;
  }

  next();
};

export const requireCompletedDriverProfile = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("User not authenticated", HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    if (user.role !== "driver") {
      throw new AppError(
        "Only drivers can access this resource",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    if (!user.isVerified) {
      throw new AppError(
        "Driver account must be verified first",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    if (!user.profileCompleted) {
      throw new AppError(
        "Driver profile completion is required before accessing this resource",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
