// src/lib/phone.ts
// Phone validation and E.164 normalisation using libphonenumber-js.
// All server-side phone handling should go through normalizePhone() / normalizePhoneNumber()
// before DB writes.
import {
  getCountryCallingCode,
  getCountries,
  parsePhoneNumberFromString,
  parsePhoneNumberWithError,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

export const DEFAULT_PHONE_COUNTRY: CountryCode = "XK";

// ─── Result type ─────────────────────────────────────────────────────────────

export type PhoneNormalizeResult =
  | { ok: true; e164: string }
  | { ok: false; error: string };

// ─── Core normalisation ───────────────────────────────────────────────────────

/**
 * Parse a user-entered phone string and return the E.164 form.
 * The input SHOULD begin with a + prefix produced by the PhoneInput component.
 * Pass `defaultCountry` only when processing legacy data that may lack a prefix.
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

/**
 * Backward-compatible wrapper used by validations/phone.ts.
 * Returns E.164 string on success, null on failure.
 */
export function normalizePhoneNumber(
  value: string | null | undefined,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): string | null {
  const result = normalizePhone(value, defaultCountry);
  return result.ok ? result.e164 : null;
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

/** Alias kept for backward compat. */
export const isValidInternationalPhone = isValidPhone;

// ─── Country selector helpers ─────────────────────────────────────────────────

export function getPhoneCountryOptions(locale: "en" | "sq" = "en") {
  const displayNames =
    typeof Intl !== "undefined" && "DisplayNames" in Intl
      ? new Intl.DisplayNames([locale], { type: "region" })
      : null;

  return getCountries()
    .map((code) => ({
      code,
      name: displayNames?.of(code) ?? code,
      callingCode: `+${getCountryCallingCode(code)}`,
    }))
    .sort((a, b) => {
      if (a.code === DEFAULT_PHONE_COUNTRY) return -1;
      if (b.code === DEFAULT_PHONE_COUNTRY) return 1;
      return a.name.localeCompare(b.name);
    });
}

export function formatPhoneForCountryInput(
  value: string | null | undefined,
  country: CountryCode = DEFAULT_PHONE_COUNTRY
) {
  const parsed = value ? parsePhoneNumberFromString(value, country) : null;
  return {
    country: parsed?.country ?? country,
    nationalNumber: parsed?.nationalNumber ?? "",
  };
}
