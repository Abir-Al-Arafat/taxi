// src/middlewares/authorize.middleware.ts

import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Assuming your authentication middleware (e.g., auth.middleware.ts)
    // already attaches the user to the request object.
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have the required permissions. Allowed roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};
