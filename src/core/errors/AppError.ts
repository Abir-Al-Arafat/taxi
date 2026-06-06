import HTTP_STATUS, { type HttpStatus } from "../../constants/statusCodes";

export class AppError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: HttpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}
