// src/lib/money.ts
// Helpers for converting Prisma Decimal to JS number at service boundaries.
// Prisma returns Prisma.Decimal objects for Decimal schema fields. All internal
// calculations use plain JS numbers (with toFixed(2) rounding). This module
// bridges the two.
import { Prisma } from "@prisma/client";

/** Convert a Prisma Decimal, number, string, null, or undefined to a JS number. */
export function toNumber(val: Prisma.Decimal | number | string | null | undefined): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  // Prisma.Decimal instance
  return val.toNumber();
}

/** Convert a nullable Prisma Decimal to number or null. */
export function toNumberOrNull(
  val: Prisma.Decimal | number | string | null | undefined
): number | null {
  if (val == null) return null;
  return toNumber(val);
}

/**
 * Recursively convert all Prisma.Decimal values in an object to numbers.
 * Used before JSON serialisation so API responses contain numbers, not strings.
 */
export function serializeDecimals<T>(obj: T): T {
  if (obj == null) return obj;
  if (obj instanceof Prisma.Decimal) return obj.toNumber() as unknown as T;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(serializeDecimals) as unknown as T;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeDecimals(value);
    }
    return result as T;
  }
  return obj;
}
