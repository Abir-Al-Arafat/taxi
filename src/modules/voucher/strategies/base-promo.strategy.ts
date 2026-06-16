// src/modules/voucher/strategies/base-promo.strategy.ts
import type { IPromoStrategy } from "../voucher.interface";

export class StandardPromoStrategy implements IPromoStrategy {
  async applyPromo(baseValue: number, promoCode?: string): Promise<number> {
    if (!promoCode) return baseValue;

    // Future integration: Call PromoModule.validate(promoCode)
    // For now, it returns the base value
    return baseValue;
  }
}
