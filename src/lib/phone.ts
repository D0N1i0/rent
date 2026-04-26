import {
  getCountryCallingCode,
  getCountries,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export const DEFAULT_PHONE_COUNTRY: CountryCode = "XK";

export function normalizePhoneNumber(
  value: string | null | undefined,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  const phone = parsePhoneNumberFromString(raw, defaultCountry);
  if (!phone || !phone.isValid()) return null;

  return phone.number;
}

export function isValidInternationalPhone(value: string | null | undefined): boolean {
  return normalizePhoneNumber(value) !== null;
}

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
