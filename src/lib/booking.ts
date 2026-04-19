// src/lib/booking.ts
// ─── Booking Service ──────────────────────────────────────────────────────────
// Centralised booking lifecycle logic: status transitions, ref generation,
// and history recording.

import type { BookingStatus, PrismaClient } from "@prisma/client";

// Single source-of-truth for valid booking status transitions.
// All API routes must import isValidTransition / getAllowedTransitions from
// here — never duplicate this map locally.
const TRANSITIONS: Partial<Record<BookingStatus, BookingStatus[]>> = {
  PENDING: ["CONFIRMED", "CANCELLED", "REJECTED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  REJECTED: [],
};

export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(from: BookingStatus): BookingStatus[] {
  return TRANSITIONS[from] ?? [];
}

/**
 * Record a booking status transition in the history table.
 * Call this inside the same transaction as the booking update.
 */
export async function recordStatusChange(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  bookingId: string,
  fromStatus: BookingStatus | null,
  toStatus: BookingStatus,
  changedById: string | null,
  reason?: string
): Promise<void> {
  await tx.bookingStatusHistory.create({
    data: {
      bookingId,
      fromStatus: fromStatus ?? undefined,
      toStatus,
      changedById: changedById ?? undefined,
      reason: reason ?? null,
    },
  });
}

/**
 * Calculate late return fee in days (rounds up).
 * Returns 0 if returned on time.
 */
export function calculateLateFee(
  originalReturn: Date,
  actualReturn: Date,
  pricePerDay: number
): { lateDays: number; fee: number } {
  const msLate = actualReturn.getTime() - originalReturn.getTime();
  if (msLate <= 0) return { lateDays: 0, fee: 0 };
  const lateDays = Math.ceil(msLate / (1000 * 60 * 60 * 24));
  return { lateDays, fee: parseFloat((lateDays * pricePerDay).toFixed(2)) };
}
