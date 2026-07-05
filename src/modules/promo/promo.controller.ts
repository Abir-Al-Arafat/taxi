// src/modules/promo/promo.controller.ts
import type { Request, Response } from "express";
import { PromoService } from "./promo.service";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import HTTP_STATUS from "../../constants/statusCodes";

export class PromoController {
  private service = new PromoService();

  // Admin Controls
  createPromo = asyncHandler(async (req: Request, res: Response) => {
    const { rules, ...promoData } = req.body;
    const promo = await this.service.createPromoCode(promoData, rules || []);
    res
      .status(HTTP_STATUS.CREATED)
      .json(
        ResponseBuilder.success(
          "Promo code created successfully",
          { promo },
          HTTP_STATUS.CREATED,
        ),
      );
  });

  updatePromo = asyncHandler(async (req: Request, res: Response) => {
    const { rules, ...promoData } = req.body;
    const updatedPromo = await this.service.updatePromoCode(
      req.params.id as string,
      promoData,
      rules || [],
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Promo code updated successfully",
          { promo: updatedPromo },
          HTTP_STATUS.OK,
        ),
      );
  });

  togglePromoStatus = asyncHandler(async (req: Request, res: Response) => {
    await this.service.togglePromoStatus(req.params.id as string);
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Promo code status toggled successfully",
          null,
          HTTP_STATUS.OK,
        ),
      );
  });

  listAllPromos = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getAdminPromoList(req.query);
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success("Promo codes retrieved", data, HTTP_STATUS.OK),
      );
  });

  getPromoDetails = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getAdminPromoDetails(
      req.params.id as string,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Promo details retrieved",
          data,
          HTTP_STATUS.OK,
        ),
      );
  });

  // User Controls
  getAvailablePromos = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.userId;
      const data = await this.service.getEligiblePromosForUser(
        userId,
        req.query,
      );
      res.status(HTTP_STATUS.OK).json(
        ResponseBuilder.success(
          "Available promos retrieved",
          {
            promos: data,
          },
          HTTP_STATUS.OK,
        ),
      );
    },
  );

  applyPromo = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.userId;
      const { code, estimatedFare } = req.body;

      const result = await this.service.applyPromoCode(
        userId,
        code,
        estimatedFare,
      );
      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Promo code applied successfully",
            result,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  getPromoStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.service.getPromoStatistics();
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Promo statistics retrieved successfully",
          stats,
          HTTP_STATUS.OK,
        ),
      );
  });
}
