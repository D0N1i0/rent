// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, differenceInHours, format, parseISO } from "date-fns";
import { randomBytes } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "€"): string {
  return `${currency}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy 'at' HH:mm");
}

export function calculateRentalDays(pickupDT: Date, returnDT: Date): number {
  const diffHours = differenceInHours(returnDT, pickupDT);
  if (diffHours <= 0) return 0;
  const diffDays = differenceInDays(returnDT, pickupDT);
  const remainingHours = diffHours - diffDays * 24;
  return diffDays + (remainingHours > 0 ? 1 : 0);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
    IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    NO_SHOW: "bg-orange-100 text-orange-800 border-orange-200",
    REJECTED: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    UNPAID: "bg-red-100 text-red-800",
    PARTIALLY_PAID: "bg-orange-100 text-orange-800",
    PAID: "bg-green-100 text-green-800",
    REFUNDED: "bg-gray-100 text-gray-800",
    WAIVED: "bg-teal-100 text-teal-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

/** Check if two date ranges overlap */
export function checkDateOverlap(
  existingStart: Date,
  existingEnd: Date,
  newStart: Date,
  newEnd: Date
): boolean {
  return newStart < existingEnd && newEnd > existingStart;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isValidImageType(mimeType: string): boolean {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(mimeType);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function parseSearchParamInt(value: string | null, fallback: number): number {
  const parsed = parseInt(value ?? "", 10);
  return isNaN(parsed) ? fallback : parsed;
}


/** Generates a cryptographically secure booking reference. Format: AK-YYYY-XXXXXX */
export function generateBookingRef(): string {
  const year = new Date().getFullYear();
  // 5 bytes = 10 hex chars = 2^40 (~1 trillion) combinations.
  // 3-byte refs were brute-forceable (16M attempts); 5 bytes are not.
  const random = randomBytes(5).toString("hex").toUpperCase();
  return `AK-${year}-${random}`;
}
