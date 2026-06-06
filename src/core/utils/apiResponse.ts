import type { HttpStatus } from "../../constants/statusCodes";

export interface ApiResponse<T> {
  success: boolean;
  status: HttpStatus;
  message: string;
  data?: T;
}

export class ResponseBuilder {
  static success<T>(
    message: string,
    data: T | undefined,
    status: HttpStatus,
  ): ApiResponse<T> {
    if (typeof data === "undefined") {
      return {
        success: true,
        status,
        message,
      };
    }

    return {
      success: true,
      status,
      message,
      data,
    };
  }

  static failure(message: string, status: HttpStatus): ApiResponse<undefined> {
    return {
      success: false,
      status,
      message,
    };
  }
}
