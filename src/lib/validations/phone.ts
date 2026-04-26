import { z } from "zod";
import { normalizePhoneNumber } from "@/lib/phone";

export const requiredPhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine((value) => normalizePhoneNumber(value) !== null, "Enter a valid phone number")
  .transform((value) => normalizePhoneNumber(value)!);

export const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || normalizePhoneNumber(value) !== null, "Enter a valid phone number")
  .transform((value) => (value ? normalizePhoneNumber(value)! : ""));
