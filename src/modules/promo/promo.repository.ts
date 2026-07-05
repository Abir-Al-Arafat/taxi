// src/modules/promo/promo.repository.ts
import { BaseRepository } from "../../repositories/base.repository";
import { PromoCode, PromoRule, PromoRedemption } from "./promo.schema";
import type {
  IPromoCode,
  IPromoRule,
  IPromoRedemption,
} from "./promo.interface";

export class PromoCodeRepository extends BaseRepository<IPromoCode> {
  constructor() {
    super(PromoCode);
  }

  async getPromoCounts(): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([
      this.model.countDocuments(),
      this.model.countDocuments({ isActive: true }),
    ]);
    return { total, active };
  }
}

export class PromoRuleRepository extends BaseRepository<IPromoRule> {
  constructor() {
    super(PromoRule);
  }
}

export class PromoRedemptionRepository extends BaseRepository<IPromoRedemption> {
  constructor() {
    super(PromoRedemption);
  }

  // Custom method to check user usage
  async countUserRedemptions(
    promoCodeId: string,
    userId: string,
  ): Promise<number> {
    const count = await this.model.countDocuments({ promoCodeId, userId });
    return count;
  }

  async getTotalDiscountApplied(): Promise<number> {
    const result = await this.model.aggregate([
      { $group: { _id: null, totalUsageAmount: { $sum: "$discountApplied" } } },
    ]);
    return result.length > 0 ? result[0].totalUsageAmount : 0;
  }
}
