import type { Response } from "express";
import { SavedPlaceService } from "./saved-place.service";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export class SavedPlaceController {
  private savedPlaceService = new SavedPlaceService();

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.userId)
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);

    const place = await this.savedPlaceService.createSavedPlace(
      req.user.userId,
      req.body,
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(
        ResponseBuilder.success(
          "Place saved successfully",
          { place },
          HTTP_STATUS.CREATED,
        ),
      );
  });

  getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.userId)
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);

    const result = await this.savedPlaceService.getUserSavedPlaces(
      req.user.userId,
      req.query,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Saved places retrieved",
          result,
          HTTP_STATUS.OK,
        ),
      );
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.userId)
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);

    const updatedPlace = await this.savedPlaceService.updateSavedPlace(
      req.user.userId,
      req.params.id as string,
      req.body,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Place updated successfully",
          { place: updatedPlace },
          HTTP_STATUS.OK,
        ),
      );
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.userId)
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);

    await this.savedPlaceService.deleteSavedPlace(
      req.user.userId,
      req.params.id as string,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Place deleted successfully",
          null,
          HTTP_STATUS.OK,
        ),
      );
  });
}
