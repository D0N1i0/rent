// src/lib/pricing.ts
// ─── Centralised Pricing Service ─────────────────────────────────────────────
// All pricing logic lives here. Nothing in API routes should compute prices
// directly — they must call these functions.

import type { Car, Extra, ExtraPricingType, Location, SeasonalPricing } from "@prisma/client";
import { getDurationDays, getSeasonalRate } from "@/lib/booking-window";

// Kosovo VAT rate – 18%
export const KOSOVO_VAT_RATE = 0.18;

function toNumber(value: number | string | { toNumber(): number } | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return value.toNumber();
}

export interface PriceBreakdown {
  durationDays: number;
  pricePerDay: number;
  subtotal: number;
  extrasTotal: number;
  pickupFee: number;
  dropoffFee: number;
  discount: number;
  preTaxTotal: number;  // total before VAT
  vatRate: number;      // e.g. 0.18
  vatAmount: number;    // VAT monetary amount
  totalAmount: number;  // grand total including VAT
  pricingTier: "daily" | "weekly" | "monthly" | "seasonal";
}

export interface ExtraLineItem {
  extraId: string;
  name: string;
  price: number;
  pricingType: ExtraPricingType;
  quantity: number;
  total: number;
}

/**
 * Determine effective price per day based on rental duration.
 * Longer rentals unlock better rates (monthly > weekly > daily).
 */
export function resolveEffectivePricePerDay(
  car: Pick<Car, "pricePerDay" | "pricePerWeek" | "pricePerMonth">,
  durationDays: number
): { pricePerDay: number; tier: "daily" | "weekly" | "monthly" } {
  const pricePerDay = toNumber(car.pricePerDay);
  const pricePerWeek = toNumber(car.pricePerWeek);
  const pricePerMonth = toNumber(car.pricePerMonth);

  if (durationDays >= 30 && pricePerMonth) {
    return { pricePerDay: pricePerMonth / 30, tier: "monthly" };
  }
  if (durationDays >= 7 && pricePerWeek) {
    return { pricePerDay: pricePerWeek / 7, tier: "weekly" };
  }
  return { pricePerDay, tier: "daily" };
}

/**
 * Calculate a single extra's total cost given the rental duration.
 */
export function calculateExtraTotal(extra: Pick<Extra, "price" | "pricingType">, durationDays: number): number {
  const price = toNumber(extra.price);
  switch (extra.pricingType) {
    case "PER_DAY":
      return price * durationDays;
    case "ONE_TIME":
    case "PER_BOOKING":
    default:
      return price;
  }
}

/**
 * Build the full price breakdown for a booking, including 18% Kosovo VAT.
 */
export function buildPriceBreakdown(
  car: Pick<Car, "pricePerDay" | "pricePerWeek" | "pricePerMonth" | "deposit"> & {
    seasonalPricing?: Pick<SeasonalPricing, "startDate" | "endDate" | "pricePerDay" | "pricePerWeek" | "isActive">[];
  },
  pickupDT: Date,
  returnDT: Date,
  pickupLoc: Pick<Location, "id" | "pickupFee">,
  dropoffLoc: Pick<Location, "id" | "dropoffFee">,
  extras: ExtraLineItem[],
  couponDiscount = 0,
  vatRate: number = KOSOVO_VAT_RATE
): PriceBreakdown {
  const durationDays = getDurationDays(pickupDT, returnDT);
  const seasonalRule = getSeasonalRate(car.seasonalPricing, pickupDT, returnDT);
  const seasonalResult = seasonalRule
    ? {
        pricePerDay:
          durationDays >= 7 && seasonalRule.pricePerWeek
            ? toNumber(seasonalRule.pricePerWeek) / 7
            : toNumber(seasonalRule.pricePerDay),
        tier: "seasonal" as const,
      }
    : null;
  const { pricePerDay, tier } = seasonalResult ?? resolveEffectivePricePerDay(car, durationDays);

  const pickupFeeNum = toNumber(pickupLoc.pickupFee);
  const dropoffFeeNum = pickupLoc.id !== dropoffLoc.id ? toNumber(dropoffLoc.dropoffFee) : 0;

  const subtotal = parseFloat((pricePerDay * durationDays).toFixed(2));
  const extrasTotal = parseFloat(extras.reduce((sum, e) => sum + e.total, 0).toFixed(2));
  const discount = parseFloat(couponDiscount.toFixed(2));
  const preTaxTotal = parseFloat(
    Math.max(0, subtotal + extrasTotal + pickupFeeNum + dropoffFeeNum - discount).toFixed(2)
  );
  const vatAmount = parseFloat((preTaxTotal * vatRate).toFixed(2));
  const totalAmount = parseFloat((preTaxTotal + vatAmount).toFixed(2));

  return {
    durationDays,
    pricePerDay,
    subtotal,
    extrasTotal,
    pickupFee: pickupFeeNum,
    dropoffFee: dropoffFeeNum,
    discount,
    preTaxTotal,
    vatRate,
    vatAmount,
    totalAmount,
    pricingTier: tier,
  };
}

/**
 * Build validated extra line items.
 */
export function buildExtraLineItems(
  extraRecords: Array<Pick<Extra, "id" | "name" | "price" | "pricingType">>,
  requestedIds: string[],
  durationDays: number
): ExtraLineItem[] {
  return extraRecords.map((extra) => ({
    extraId: extra.id,
    name: extra.name,
    price: toNumber(extra.price),
    pricingType: extra.pricingType,
    quantity: 1,
    total: calculateExtraTotal(extra, durationDays),
  }));
}

/**
 * Format a price breakdown into a human-readable summary for display.
 */
export function formatPriceBreakdown(breakdown: PriceBreakdown, currency = "€") {
  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;
  const vatPct = Math.round(breakdown.vatRate * 100);
  return {
    tierLabel:
      breakdown.pricingTier === "monthly"
        ? "Monthly rate applied"
        : breakdown.pricingTier === "weekly"
        ? "Weekly rate applied"
        : "Daily rate",
    lines: [
      { label: `${fmt(breakdown.pricePerDay)}/day × ${breakdown.durationDays} days`, value: fmt(breakdown.subtotal) },
      ...(breakdown.extrasTotal > 0 ? [{ label: "Extras", value: fmt(breakdown.extrasTotal) }] : []),
      ...(breakdown.pickupFee > 0 ? [{ label: "Pickup fee", value: fmt(breakdown.pickupFee) }] : []),
      ...(breakdown.dropoffFee > 0 ? [{ label: "Drop-off fee", value: fmt(breakdown.dropoffFee) }] : []),
      ...(breakdown.discount > 0 ? [{ label: "Discount", value: `-${fmt(breakdown.discount)}` }] : []),
      ...(breakdown.vatAmount > 0 ? [{ label: `VAT (${vatPct}%)`, value: fmt(breakdown.vatAmount) }] : []),
    ],
    preTaxTotal: fmt(breakdown.preTaxTotal),
    vatLine: breakdown.vatAmount > 0 ? `VAT ${vatPct}%: ${fmt(breakdown.vatAmount)}` : null,
    total: fmt(breakdown.totalAmount),
  };
}
