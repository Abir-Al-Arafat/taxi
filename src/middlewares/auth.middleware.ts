import { Request, Response, NextFunction } from "express";
import { AppError } from "../core/errors/AppError";
import HTTP_STATUS from "../constants/statusCodes";
import { JwtService } from "../shared/services/jwt.service";

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string; iat: number; exp: number };
}

const jwtService = new JwtService();

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "Authorization header missing or invalid",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);

    const decoded = jwtService.verify<{
      userId: string;
      role: string;
      iat: number;
      exp: number;
    }>(token, false);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(
        new AppError(
          "Invalid or expired access token",
          HTTP_STATUS.UNAUTHORIZED,
        ),
      );
    }
  }
};
