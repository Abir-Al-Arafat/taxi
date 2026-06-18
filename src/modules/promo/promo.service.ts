// src/modules/promo/promo.service.ts
import { Types } from "mongoose";
import {
  PromoCodeRepository,
  PromoRuleRepository,
  PromoRedemptionRepository,
} from "./promo.repository";
import { UserRepository } from "../user/user.repository";
import { AppError } from "../../core/errors/AppError";
import HTTP_STATUS from "../../constants/statusCodes";
import type { IPaginationParams } from "../../shared/types/pagination.types";
import type { IPromoRule } from "./promo.interface";

export class PromoService {
  private promoRepo = new PromoCodeRepository();
  private ruleRepo = new PromoRuleRepository();
  private redemptionRepo = new PromoRedemptionRepository();
  private userRepo = new UserRepository();

  // ==============================================
  // ADMIN FLOWS
  // ==============================================
  async createPromoCode(data: any, rules: Partial<IPromoRule>[]) {
    // 1. Create the Promo Code
    const promo = await this.promoRepo.create({
      ...data,
      code: data.code.toUpperCase(),
    });

    // 2. Attach the Rules
    if (rules && rules.length > 0) {
      const formattedRules = rules.map((r) => ({
        ...r,
        promoCodeId: promo._id,
      }));
      await this.ruleRepo.insertMany(formattedRules);
    }
    return promo;
  }

  async getAdminPromoList(params: IPaginationParams) {
    return this.promoRepo.findPaginated(params, {}, []);
  }

  async getAdminPromoDetails(promoId: string) {
    const promo = await this.promoRepo.findOne({ _id: promoId });
    if (!promo) {
      throw new AppError("Promo code not found", HTTP_STATUS.NOT_FOUND);
    }

    const rules = await this.ruleRepo.findMany({ promoCodeId: promo._id });
    return {
      promo,
      rules,
    };
  }

  // ==============================================
  // RULE ENGINE LOGIC
  // ==============================================
  private async validateUserAgainstRules(
    userId: string,
    rules: IPromoRule[],
  ): Promise<boolean> {
    if (!rules || rules.length === 0) return true; // No rules = valid for everyone

    const user: any = await this.userRepo.findOne({ _id: userId });
    if (!user) return false;

    // 🔌 FUTURE INTEGRATION POINT: Fetch actual ride stats from RideModule
    // For now, defaulting to placeholder values to satisfy the engine
    const userStats = {
      totalRides: 0, // Mock: Replace with actual ride count
      daysSinceLastRide: 100, // Mock: Replace with actual calculation
    };

    for (const rule of rules) {
      const { ruleKey, ruleOperator, ruleValue } = rule;
      let targetValue: any;

      if (ruleKey === "user_type") targetValue = user.role;
      if (ruleKey === "total_rides") targetValue = userStats.totalRides;
      if (ruleKey === "days_since_last_ride")
        targetValue = userStats.daysSinceLastRide;

      // Operator Logic
      if (
        ruleOperator === "equals" &&
        String(targetValue) !== String(ruleValue)
      )
        return false;
      if (
        ruleOperator === "greater_than" &&
        Number(targetValue) <= Number(ruleValue)
      )
        return false;
      if (
        ruleOperator === "less_than" &&
        Number(targetValue) >= Number(ruleValue)
      )
        return false;
    }

    return true; // Passed all checks
  }

  // ==============================================
  // USER FLOWS
  // ==============================================
  async getEligiblePromosForUser(userId: string, params: IPaginationParams) {
    const now = new Date();

    // 1. Get functionally active codes (Within dates, not exhausted)
    const activePromos = await this.promoRepo.findPaginated(params, {
      isActive: true,
      startDate: { $lte: now },
      expiryDate: { $gte: now },
      $expr: { $lt: ["$currentUsage", "$totalUsageLimit"] }, // Only codes with usage left
    });

    const eligiblePromos = [];

    // 2. Filter via Rule Engine
    for (const promo of activePromos.items as any[]) {
      const rules = (await this.ruleRepo.findMany({
        promoCodeId: promo._id,
      })) as IPromoRule[];
      const isEligible = await this.validateUserAgainstRules(userId, rules);

      if (isEligible) {
        eligiblePromos.push({
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          expiryDate: promo.expiryDate,
        });
      }
    }

    return eligiblePromos;
  }

  async applyPromoCode(
    userId: string,
    code: string,
    estimatedFare: number = 0,
  ) {
    const user: any = await this.userRepo.findOne({ _id: userId });
    if (!user) throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);

    // CHECK 1: Exists & Active
    const promo = await this.promoRepo.findOne({ code: code.toUpperCase() });
    if (!promo) throw new AppError("Invalid promo code", HTTP_STATUS.NOT_FOUND);
    if (!promo.isActive)
      throw new AppError(
        "This promo code is currently inactive",
        HTTP_STATUS.BAD_REQUEST,
      );

    const now = new Date();
    if (now < promo.startDate || now > promo.expiryDate) {
      throw new AppError(
        "This promo code is expired or not yet active",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // CHECK 2: Global Limits
    if (promo.currentUsage >= promo.totalUsageLimit) {
      throw new AppError(
        "This promo code has reached its maximum usage limit",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // CHECK 3: Per-User Limit
    const userUsageCount = await this.redemptionRepo.countUserRedemptions(
      promo._id as any,
      userId,
    );
    if (userUsageCount >= promo.perUserLimit) {
      throw new AppError(
        "You have already used this promo code the maximum allowed times",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // CHECK 4: Execute Rule Engine
    const rules = (await this.ruleRepo.findMany({
      promoCodeId: promo._id,
    })) as IPromoRule[];
    const isEligible = await this.validateUserAgainstRules(userId, rules);
    if (!isEligible) {
      throw new AppError(
        "This promo code is not available for your account",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    // REDEMPTION & ATOMIC UPDATE
    // Safely increment only if the limit hasn't been breached simultaneously
    const updatedPromo = await this.promoRepo.updateOne(
      { _id: promo._id, currentUsage: { $lt: promo.totalUsageLimit } },
      { $inc: { currentUsage: 1 } },
    );

    if (!updatedPromo) {
      throw new AppError(
        "Failed to apply code. It may have just reached its usage limit.",
        HTTP_STATUS.CONFLICT,
      );
    }

    // Calculate Discount
    let discountApplied = 0;
    if (promo.discountType === "fixed_amount") {
      discountApplied = promo.discountValue;
    } else if (promo.discountType === "percentage") {
      discountApplied = estimatedFare * (promo.discountValue / 100);
    }

    // Record the usage
    await this.redemptionRepo.create({
      promoCodeId: promo._id as any,
      userId: new Types.ObjectId(userId),
      userType: user.role,
      discountApplied,
    });

    return {
      promoCode: promo.code,
      discountType: promo.discountType,
      discountApplied,
      originalFare: estimatedFare,
      finalFare: Math.max(0, estimatedFare - discountApplied),
    };
  }
}
