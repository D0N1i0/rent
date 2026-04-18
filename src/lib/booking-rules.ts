import { addHours, parseISO } from "date-fns";
import type { Offer, SeasonalPricing } from "@prisma/client";
import { calculateRentalDays } from "@/lib/utils";

export const BOOKING_RULES = {
  minimumLeadHours: 2,
  minimumRentalHours: 1,
  minimumRentalDaysForPricing: 1,
  activeBookingStatuses: ["PENDING", "CONFIRMED", "IN_PROGRESS"] as const,
} as const;

export function buildBookingDateTimes(input: {
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}) {
  return {
    pickupDT: parseISO(`${input.pickupDate}T${input.pickupTime}:00`),
    returnDT: parseISO(`${input.returnDate}T${input.returnTime}:00`),
  };
}

export function validateBookingWindow(
  pickupDT: Date,
  returnDT: Date,
  now = new Date(),
  minimumLeadHoursOverride?: number
): string | null {
  const leadHours = minimumLeadHoursOverride ?? BOOKING_RULES.minimumLeadHours;
  if (Number.isNaN(pickupDT.getTime()) || Number.isNaN(returnDT.getTime())) {
    return "Invalid pickup or return date";
  }
  if (pickupDT < addHours(now, leadHours)) {
    return `Pickup must be at least ${leadHours} hours from now`;
  }
  if (returnDT <= pickupDT) {
    return "Return date and time must be after pickup";
  }
  const diffHours = (returnDT.getTime() - pickupDT.getTime()) / 3_600_000;
  if (diffHours < BOOKING_RULES.minimumRentalHours) {
    return `Minimum rental duration is ${BOOKING_RULES.minimumRentalHours} hour`;
  }
  return null;
}

/**
 * Returns the applicable seasonal pricing rule for a booking window.
 *
 * Cross-season behavior (business rule):
 *   A seasonal rate only applies when the ENTIRE booking window falls within
 *   that seasonal period (pickupDT >= startDate AND dropoffDT <= endDate).
 *   If a booking spans multiple seasonal periods, no seasonal override is
 *   applied and the car's base pricing is used instead. This is intentional —
 *   split-period calculation is not supported; admins should advise customers
 *   to split long cross-season bookings manually if preferred rates are needed.
 *
 *   If multiple active rules fully contain the booking window, the narrowest
 *   (earliest-ending) rule wins to ensure the most specific season applies.
 */
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

  // Pick the narrowest (most specific) matching season
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

  // Enforce minimum subtotal requirement
  if (offer.minSubtotal != null && subtotal < offer.minSubtotal) return 0;

  // Enforce minimum rental days requirement
  if (offer.minRentalDays != null && durationDays < offer.minRentalDays) return 0;

  // Apply percentage discount first, then add fixed amount discount on top
  // Business rule: both can apply simultaneously (e.g. 10% + €5 fixed)
  const pctDiscount = offer.discountPct ? subtotal * (offer.discountPct / 100) : 0;
  const fixedDiscount = offer.discountAmt ?? 0;

  // Total discount cannot exceed the subtotal itself
  return Number(Math.min(subtotal, pctDiscount + fixedDiscount).toFixed(2));
}

export function getDurationDays(pickupDT: Date, returnDT: Date) {
  return Math.max(BOOKING_RULES.minimumRentalDaysForPricing, calculateRentalDays(pickupDT, returnDT));
}
