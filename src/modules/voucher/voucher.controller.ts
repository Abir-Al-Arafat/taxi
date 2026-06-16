// src/modules/voucher/voucher.controller.ts
import type { Request, Response } from "express";
import { VoucherService } from "./voucher.service";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import HTTP_STATUS from "../../constants/statusCodes";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { UserService } from "../user/user.service";

export class VoucherController {
  private service = new VoucherService();
  private userService = new UserService();

  // Admin Controls
  generateBatch = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const batch = await this.service.generateBatch(
        req.user!.userId,
        req.body,
      );
      res
        .status(201)
        .json(
          ResponseBuilder.success(
            "Batch generated successfully",
            { batch },
            HTTP_STATUS.CREATED,
          ),
        );
    },
  );

  listVouchers = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.listVouchers(req.query, req.query);
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success("Vouchers retrieved", result, HTTP_STATUS.OK),
      );
  });

  listBatches = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.listBatches(req.query);
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success("Batches retrieved", result, HTTP_STATUS.OK),
      );
  });

  getVoucherByCode = asyncHandler(async (req: Request, res: Response) => {
    const voucher = await this.service.getVoucherByCode(
      req.params.code as string,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success("Voucher found", { voucher }, HTTP_STATUS.OK),
      );
  });

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const updated = await this.service.updateStatus(
      req.params.id as string,
      req.body.status,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Voucher status updated",
          { voucher: updated },
          HTTP_STATUS.OK,
        ),
      );
  });

  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await this.service.getStats();
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Voucher statistics",
          { stats },
          HTTP_STATUS.OK,
        ),
      );
  });

  // Driver Controls
  redeemVoucher = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { code, promoCode } = req.body;

      // 3. Extract the ID from the strictly typed JWT payload
      const driverId = req.user!.userId;

      // 4. Fetch the user details dynamically to get their name for soft-referencing
      const user = await this.userService.getUserById(driverId);
      const driverName = user
        ? `${user.firstName} ${user.lastName}`.trim()
        : "Unknown Driver";

      // 5. Execute redemption with the fetched name
      const result = await this.service.redeemVoucher(
        code,
        driverId,
        driverName,
        promoCode,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Voucher redeemed successfully",
            result,
            HTTP_STATUS.OK,
          ),
        );
    },
  );
}
