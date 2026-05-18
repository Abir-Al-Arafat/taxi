export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export class ResponseBuilder {
  static success<T>(message: string, data?: T): ApiResponse<T> {
    if (typeof data === "undefined") {
      return {
        success: true,
        message,
      };
    }

    return {
      success: true,
      message,
      data,
    };
  }

  static failure(message: string): ApiResponse<undefined> {
    return {
      success: false,
      message,
    };
  }
}
