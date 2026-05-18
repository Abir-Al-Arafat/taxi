import { NextFunction, Request, Response } from "express";
import { AppError } from "../core/errors/AppError";
import { ResponseBuilder } from "../core/utils/apiResponse";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(ResponseBuilder.failure(err.message));
    return;
  }

  res.status(500).json(ResponseBuilder.failure("Internal server error"));
};
