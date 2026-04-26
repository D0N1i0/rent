import { addHours } from "date-fns";
import type { Offer, SeasonalPricing } from "@prisma/client";
import { BUSINESS_TIMEZONE, calculateRentalDays } from "@/lib/utils";

export const BOOKING_WINDOW_RULES = {
  minimumLeadHours: 2,
  minimumRentalHours: 1,
  minimumRentalDaysForPricing: 1,
} as const;

export function kosovoWallTimeToUtc(date: string, time: string): Date {
  const asUtc = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return asUtc;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(asUtc)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});

  const zoneAsUtcMillis = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "00" : parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  const offset = zoneAsUtcMillis - asUtc.getTime();
  return new Date(asUtc.getTime() - offset);
}

export function buildBookingDateTimes(input: {
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}) {
  return {
    pickupDT: kosovoWallTimeToUtc(input.pickupDate, input.pickupTime),
    returnDT: kosovoWallTimeToUtc(input.returnDate, input.returnTime),
  };
}

export function validateBookingWindow(pickupDT: Date, returnDT: Date, now = new Date()): string | null {
  if (Number.isNaN(pickupDT.getTime()) || Number.isNaN(returnDT.getTime())) {
    return "Invalid pickup or return date";
  }
  if (pickupDT < addHours(now, BOOKING_WINDOW_RULES.minimumLeadHours)) {
    return `Pickup must be at least ${BOOKING_WINDOW_RULES.minimumLeadHours} hours from now`;
  }
  if (returnDT <= pickupDT) {
    return "Return date and time must be after pickup";
  }
  const diffHours = (returnDT.getTime() - pickupDT.getTime()) / 3_600_000;
  if (diffHours < BOOKING_WINDOW_RULES.minimumRentalHours) {
    return `Minimum rental duration is ${BOOKING_WINDOW_RULES.minimumRentalHours} hour`;
  }
  return null;
}

export function getDurationDays(pickupDT: Date, returnDT: Date) {
  return Math.max(BOOKING_WINDOW_RULES.minimumRentalDaysForPricing, calculateRentalDays(pickupDT, returnDT));
}

export function getSeasonalRate(
  rules: Pick<SeasonalPricing, "startDate" | "endDate" | "pricePerDay" | "pricePerWeek" | "isActive">[] | undefined,
  pickupDT: Date,
  returnDT: Date
) {
  if (!rules?.length) return null;

  const matching = rules.filter(
    (rule) =>
      rule.isActive &&
      pickupDT >= new Date(rule.startDate) &&
      returnDT <= new Date(rule.endDate)
  );

  if (!matching.length) return null;

  return matching.sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  )[0];
}

export function calculateOfferDiscount(params: {
  offer: Pick<Offer, "isActive" | "validFrom" | "validUntil" | "discountPct" | "discountAmt" | "minSubtotal" | "minRentalDays">;
  now?: Date;
  subtotal: number;
  durationDays: number;
}) {
  const { offer, subtotal, durationDays } = params;
  const now = params.now ?? new Date();

  if (!offer.isActive) return 0;
  if (offer.validFrom && now < offer.validFrom) return 0;
  if (offer.validUntil && now > offer.validUntil) return 0;

  const toNumber = (value: number | string | { toNumber(): number } | null | undefined) => {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;
    return value.toNumber();
  };

  const minSubtotal = toNumber(offer.minSubtotal);
  const discountPct = toNumber(offer.discountPct);
  const discountAmt = toNumber(offer.discountAmt);

  if (offer.minSubtotal != null && subtotal < minSubtotal) return 0;
  if (offer.minRentalDays != null && durationDays < offer.minRentalDays) return 0;

  const pctDiscount = discountPct ? subtotal * (discountPct / 100) : 0;
  return Number(Math.min(subtotal, pctDiscount + discountAmt).toFixed(2));
}
