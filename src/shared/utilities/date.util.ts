import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
export const parseDate = (dateString: string): Date => {
  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(
      "Date of birth must be a valid date",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return parsedDate;
};
