import { addHours } from "date-fns";
import type { Offer, Prisma, SeasonalPricing } from "@prisma/client";
import { BUSINESS_TIMEZONE, calculateRentalDays } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const BOOKING_RULES = {
  minimumLeadHours: 2,
  minimumRentalHours: 1,
  minimumRentalDaysForPricing: 1,
  activeBookingStatuses: ["PENDING", "CONFIRMED", "IN_PROGRESS"] as const,
  // An unpaid PENDING booking holds availability for at most this long.
  // After the TTL expires, the reservation stops blocking new bookings so
  // abandoned checkouts never permanently lock a car.
  pendingHoldMinutes: 30,
} as const;

/**
 * Build the Prisma `where` fragment that matches any booking which should
 * block a new reservation on the same car. Used by both availability checks
 * and the booking-create conflict query so behaviour cannot drift.
 *
 * Expired PENDING+UNPAID holds (older than `pendingHoldMinutes`) are
 * intentionally excluded: they represent abandoned checkouts and must not
 * permanently lock a vehicle.
 */
export function bookingConflictStatusFilter(now: Date = new Date()): Prisma.BookingWhereInput {
  const holdCutoff = new Date(
    now.getTime() - BOOKING_RULES.pendingHoldMinutes * 60_000
  );
  return {
    OR: [
      { status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
      {
        AND: [
          { status: "PENDING" },
          {
            OR: [
              { paymentStatus: { not: "UNPAID" } },
              { createdAt: { gte: holdCutoff } },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Convert a Kosovo wall-clock date+time string into the correct UTC instant.
 *
 * `parseISO("2026-07-01T10:00:00")` without an offset depends on the host's
 * local timezone. On a UTC production server (e.g. Vercel) this reads as
 * UTC → the booking is stored 1-2 hours off, availability checks break, and
 * customers get emails with the wrong times.
 *
 * This helper round-trips the naive timestamp through `Intl.DateTimeFormat`
 * in the business zone to compute the zone's UTC offset on that specific
 * date, handling DST transitions automatically.
 */
function kosovoWallTimeToUtc(date: string, time: string): Date {
  // First, interpret the naive ISO string as if it were already UTC.
  const asUtc = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return asUtc;

  // Re-format that same instant as wall-clock in the business zone...
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(asUtc).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});

  // ...and treat the zone-local parts as UTC, giving us the millis between
  // "UTC-interpretation" and "business-zone-interpretation". That difference
  // is the zone offset at that moment — apply it to shift the naive instant
  // from UTC into the correct UTC instant for the Kosovo wall-clock input.
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

export { kosovoWallTimeToUtc };

export function validateBookingWindow(pickupDT: Date, returnDT: Date, now = new Date()): string | null {
  if (Number.isNaN(pickupDT.getTime()) || Number.isNaN(returnDT.getTime())) {
    return "Invalid pickup or return date";
  }
  if (pickupDT < addHours(now, BOOKING_RULES.minimumLeadHours)) {
    return `Pickup must be at least ${BOOKING_RULES.minimumLeadHours} hours from now`;
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

// ─── Stale-hold cleanup ───────────────────────────────────────────────────────
// Explicitly close out abandoned PENDING+UNPAID bookings that are past the
// hold TTL. Runs opportunistically from request-driven flows (booking list,
// admin dashboard, booking create) — no separate cron needed.
//
// Safety guarantees:
//   - only affects PENDING + UNPAID bookings (never touches paid/confirmed)
//   - only affects rows older than `pendingHoldMinutes`
//   - status history is recorded so the audit trail stays intact
//   - updates are batched to keep a single request cheap
//   - `cappedAt` caps the work per invocation so a busy system isn't starved
let lastCleanupRun = 0;
const CLEANUP_MIN_INTERVAL_MS = 60_000; // at most once per minute per instance

export async function closeAbandonedPendingBookings(now: Date = new Date(), cappedAt = 50) {
  // Rate-limit per instance so every request isn't doing cleanup work.
  if (now.getTime() - lastCleanupRun < CLEANUP_MIN_INTERVAL_MS) return 0;
  lastCleanupRun = now.getTime();

  const cutoff = new Date(now.getTime() - BOOKING_RULES.pendingHoldMinutes * 60_000);

  const stale = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      paymentStatus: "UNPAID",
      createdAt: { lt: cutoff },
    },
    select: { id: true },
    take: cappedAt,
  });

  if (!stale.length) return 0;

  const ids = stale.map((b) => b.id);
  await prisma.$transaction([
    prisma.booking.updateMany({
      where: { id: { in: ids }, status: "PENDING", paymentStatus: "UNPAID" },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancellationReason: "Abandoned checkout — payment not completed within hold window",
      },
    }),
    prisma.bookingStatusHistory.createMany({
      data: ids.map((id) => ({
        bookingId: id,
        fromStatus: "PENDING" as const,
        toStatus: "CANCELLED" as const,
        reason: "Abandoned checkout — auto-cancelled after hold expiry",
      })),
    }),
    prisma.activityLog.createMany({
      data: ids.map((id) => ({
        action: "BOOKING_AUTO_CANCELLED",
        entity: "Booking" as const,
        entityId: id,
        details: { reason: "abandoned-checkout", holdMinutes: BOOKING_RULES.pendingHoldMinutes },
      })),
    }),
  ]);

  console.log(`[booking-cleanup] auto-cancelled ${ids.length} abandoned PENDING bookings`);
  return ids.length;
}
