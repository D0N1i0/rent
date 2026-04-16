// src/lib/booking.ts
// ─── Booking Service ──────────────────────────────────────────────────────────
// Centralised booking lifecycle logic: status transitions, ref generation,
// overlap detection, and history recording.

import { randomBytes } from "crypto";
import type { BookingStatus, PrismaClient } from "@prisma/client";

// Valid status transitions (from → [allowed tos])
// Keep in sync with VALID_STATUS_TRANSITIONS in src/app/api/admin/bookings/[id]/route.ts
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

/**
 * Generate a booking reference with retry on collision.
 * Format: AK-YYYY-XXXXXX (6 hex chars = 16M possibilities)
 */
export async function generateUniqueBookingRef(
  prisma: PrismaClient,
  maxRetries = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const year = new Date().getFullYear();
    const random = randomBytes(3).toString("hex").toUpperCase();
    const ref = `AK-${year}-${random}`;

    const existing = await prisma.booking.findUnique({
      where: { bookingRef: ref },
      select: { id: true },
    });

    if (!existing) return ref;
  }
  // Fallback: use timestamp + random for guaranteed uniqueness
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(2).toString("hex").toUpperCase();
  return `AK-${ts}-${rand}`;
}

/**
 * Check if two date ranges overlap.
 * Uses strict overlap: [start1, end1) overlaps [start2, end2) if start1 < end2 && start2 < end1
 */
export function datesOverlap(
  existingStart: Date,
  existingEnd: Date,
  newStart: Date,
  newEnd: Date
): boolean {
  return newStart < existingEnd && newEnd > existingStart;
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
