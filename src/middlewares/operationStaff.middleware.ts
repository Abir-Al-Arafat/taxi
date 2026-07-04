// src/middlewares/operationStaff.middleware.ts
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";
import { AppError } from "../core/errors/AppError";
import HTTP_STATUS from "../constants/statusCodes";

export const requireOperationStaffRole = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== "operation staff") {
    next(
      new AppError(
        "Access denied. Operation staff authentication privileges required.",
        HTTP_STATUS.FORBIDDEN,
      ),
    );
    return;
  }
  next();
};
