import { Request, Response } from "express";
import HTTP_STATUS from "../constants/statusCodes";
import { ResponseBuilder } from "../core/utils/apiResponse";

export const notFoundMiddleware = (_req: Request, res: Response): void => {
  res
    .status(HTTP_STATUS.NOT_FOUND)
    .json(ResponseBuilder.failure("Route not found", HTTP_STATUS.NOT_FOUND));
};
