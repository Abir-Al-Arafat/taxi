// src/modules/wallet/wallet.controller.ts
import type { Request, Response } from "express";
import { WalletService } from "./wallet.service";
import { VoucherService } from "../voucher/voucher.service";
import { UserService } from "../user/user.service";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { ResponseBuilder } from "../../core/utils/apiResponse";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import HTTP_STATUS from "../../constants/statusCodes";
import type {
  IPaginationParams,
  IPaginatedResult,
} from "../../shared/types/pagination.types";
export class WalletController {
  private walletService = new WalletService();
  private voucherService = new VoucherService();
  private userService = new UserService();

  getMyBalance = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const wallet = await this.walletService.getMyBalance(req.user!.userId);
      res.status(HTTP_STATUS.OK).json(
        ResponseBuilder.success(
          "Wallet balance retrieved",
          {
            balance: wallet.balance,
            currency: wallet.currency,
          },
          HTTP_STATUS.OK,
        ),
      );
    },
  );

  getMyTransactions = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const transactions = await this.walletService.getMyTransactions(
        req.user!.userId,
        req.query,
      );
      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Wallet transactions retrieved",
            transactions,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  // Moves the /top-up route logically into the Wallet domain while executing Voucher logic
  topUpWithVoucher = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { code, promoCode } = req.body;
      const driverId = req.user!.userId;

      // Resolve soft-reference constraints securely
      const user = await this.userService.getUserById(driverId);
      const driverName = user
        ? `${user.firstName} ${user.lastName}`.trim()
        : "Driver";

      // Validates, updates the voucher state, and asynchronously emits WALLET_TOP_UP_REQUESTED
      const result = await this.voucherService.redeemVoucher(
        code,
        driverId,
        driverName,
        promoCode,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Voucher successfully validated. Wallet is being securely credited.",
            result,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  getWalletDashboard = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, sort, role, status }: any = req.query;

    const paginationParams: IPaginationParams = {
      page: page,
      limit: limit,
      search: search,
      sort: sort,
    };

    // 2. Build the dynamic filters object securely
    const filters: any = {};

    // If the frontend explicitly wants to filter by wallet status
    if (status) {
      filters.status = status;
    }

    // If the frontend explicitly wants to filter by user role
    // We map "role" to "userDoc.role" because of the $lookup join in the repository
    if (role) {
      // Use regex to make it case-insensitive (e.g. handles "Driver", "driver", "DRIVER")
      filters["userDoc.role"] = { $regex: new RegExp(`^${role}$`, "i") };
    }

    const data = await this.walletService.getAdminWalletDashboard(
      paginationParams,
      filters,
    );
    res
      .status(HTTP_STATUS.OK)
      .json(
        ResponseBuilder.success(
          "Driver wallets retrieved",
          data,
          HTTP_STATUS.OK,
        ),
      );
  });

  adminTopUp = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const adminId = req.user!.userId;
      const { driverId, amount, description } = req.body;

      const result = await this.walletService.adminTopUpWallet(
        adminId,
        driverId,
        amount,
        description,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Wallet successfully topped up",
            result,
            HTTP_STATUS.OK,
          ),
        );
    },
  );

  adminDeduct = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const adminId = req.user!.userId;
      const { driverId, amount, description } = req.body;

      const result = await this.walletService.adminDeductWallet(
        adminId,
        driverId,
        amount,
        description,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(
          ResponseBuilder.success(
            "Wallet successfully deducted",
            result,
            HTTP_STATUS.OK,
          ),
        );
    },
  );
}
