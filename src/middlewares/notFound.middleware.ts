import { Request, Response } from "express";
import { ResponseBuilder } from "../core/utils/apiResponse";

export const notFoundMiddleware = (_req: Request, res: Response): void => {
  res.status(404).json(ResponseBuilder.failure("Route not found"));
};
