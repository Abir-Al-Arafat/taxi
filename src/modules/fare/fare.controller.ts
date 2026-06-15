// src/modules/fare/fare.controller.ts
import type { Request, Response } from "express";
import { FareService } from "./fare.service";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import HTTP_STATUS from "../../constants/statusCodes";

export class FareController {
  private fareService = new FareService();

  createPricingRule = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // Passes the fully validated body down to the service layer
      const newFare = await this.fareService.createFareConfig(req.body);

      res
        .status(HTTP_STATUS.CREATED)
        .json(
          ResponseBuilder.success(
            `Fare configuration for '${newFare.gender}' services created successfully`,
            { fare: newFare },
            HTTP_STATUS.CREATED,
          ),
        );
    },
  );

  getPricingRules = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
      const fares = await this.fareService.getAllFares();
      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Pricing configurations retrieved securely",
            { fares },
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  updatePricingRule = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { gender } = req.params;
      const updatedFare = await this.fareService.updateFareConfig(
        gender as string,
        req.body,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            `Fare configuration mapped to '${gender}' successfully updated`,
            { fare: updatedFare },
            HTTP_STATUS.OK,
          ),
        );
    },
  );
}
