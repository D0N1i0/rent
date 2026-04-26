// src/lib/phone.ts
// Phone validation and E.164 normalisation using libphonenumber-js.
// All server-side phone handling should go through normalizePhone() before DB writes.
import { parsePhoneNumberWithError, isValidPhoneNumber, type CountryCode } from "libphonenumber-js";

export type PhoneNormalizeResult =
  | { ok: true; e164: string }
  | { ok: false; error: string };

/**
 * Parse a user-entered phone string (may include spaces, dashes, parens)
 * and return the E.164 form, e.g. "+38344123456".
 *
 * The input MUST begin with a + prefix (country dial code) as produced by
 * the PhoneInput component. Pass `defaultCountry` only when processing
 * legacy data that may lack a prefix.
 *
 * Returns { ok: true, e164 } on success or { ok: false, error } on failure.
 */
export function normalizePhone(
  raw: string | null | undefined,
  defaultCountry?: CountryCode
): PhoneNormalizeResult {
  if (!raw || !raw.trim()) return { ok: false, error: "Phone number is required" };

  const cleaned = raw.trim();

  try {
    const parsed = parsePhoneNumberWithError(cleaned, defaultCountry);
    if (!parsed.isValid()) {
      return { ok: false, error: "Invalid phone number" };
    }
    return { ok: true, e164: parsed.format("E.164") };
  } catch {
    return { ok: false, error: "Invalid phone number format" };
  }
}

/**
 * Same as normalizePhone but for optional phone fields.
 * Returns null (no phone provided) or { ok, e164/error }.
 */
export function normalizeOptionalPhone(
  raw: string | null | undefined,
  defaultCountry?: CountryCode
): PhoneNormalizeResult | null {
  if (!raw || !raw.trim()) return null;
  return normalizePhone(raw, defaultCountry);
}

/** Quick boolean check — useful for Zod .refine(). */
export function isValidPhone(raw: string, defaultCountry?: CountryCode): boolean {
  if (!raw?.trim()) return false;
  try {
    return isValidPhoneNumber(raw.trim(), defaultCountry);
  } catch {
    return false;
  }
}
