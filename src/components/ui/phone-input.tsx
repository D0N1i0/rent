"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AsYouType, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneForCountryInput,
  getPhoneCountryOptions,
  normalizePhoneNumber,
} from "@/lib/phone";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
}

const countryOptions = getPhoneCountryOptions();

function countryFlag(code: string) {
  if (code === "XK") return "🇽🇰";
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function nationalInputToPhone(country: CountryCode, nationalNumber: string) {
  const digits = nationalNumber.replace(/[^\d]/g, "");
  if (!digits) return "";

  const raw = `+${getCountryCallingCode(country)}${digits}`;
  return normalizePhoneNumber(raw, country) ?? raw;
}

function formatNational(country: CountryCode, nationalNumber: string) {
  const digits = nationalNumber.replace(/[^\d]/g, "");
  if (!digits) return "";
  return new AsYouType(country).input(digits);
}

export function PhoneInput({
  value,
  onChange,
  error,
  id = "phone",
  disabled,
  placeholder = "44 123 456",
}: PhoneInputProps) {
  const parsed = formatPhoneForCountryInput(value, DEFAULT_PHONE_COUNTRY);
  const [country, setCountry] = useState<CountryCode>(parsed.country);
  const [nationalNumber, setNationalNumber] = useState(parsed.nationalNumber);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = formatPhoneForCountryInput(value, country);
    setCountry(p.country);
    setNationalNumber(p.nationalNumber);
  }, [country, value]);

  const handleCountryChange = (code: CountryCode) => {
    setCountry(code);
    setOpen(false);
    setSearch("");
    onChange(nationalInputToPhone(code, nationalNumber));
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNational(country, e.target.value);
    setNationalNumber(formatted);
    onChange(nationalInputToPhone(country, formatted));
  };

  const selectedCountry = countryOptions.find((c) => c.code === country) ?? countryOptions[0];

  const filtered = useMemo(
    () =>
      search
        ? countryOptions.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.callingCode.includes(search) ||
              c.code.toLowerCase().includes(search.toLowerCase())
          )
        : countryOptions,
    [search]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div>
      <div
        className={cn(
          "flex rounded-xl border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-navy-900/30 transition-shadow",
          error ? "border-red-400" : "border-gray-200"
        )}
      >
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 px-3 py-2.5 h-full bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 min-w-[88px]"
            aria-label="Select phone country"
            aria-expanded={open}
          >
            <span className="text-base leading-none">{countryFlag(selectedCountry.code)}</span>
            <span className="text-xs">{selectedCountry.callingCode}</span>
            <ChevronDown className={cn("h-3 w-3 text-gray-400 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute top-full left-0 z-50 mt-1 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Search country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-900/30"
                  autoFocus
                />
              </div>
              <ul className="max-h-52 overflow-y-auto">
                {filtered.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => handleCountryChange(c.code)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors",
                        c.code === country && "bg-navy-50 text-navy-900 font-medium"
                      )}
                    >
                      <span className="text-base leading-none w-5 text-center">{countryFlag(c.code)}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-gray-400 text-xs shrink-0">{c.callingCode}</span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-3 py-4 text-sm text-gray-400 text-center">No countries found</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <input
          id={id}
          type="tel"
          inputMode="tel"
          value={nationalNumber}
          onChange={handleLocalChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="tel-national"
          className="flex-1 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none placeholder:text-gray-400 min-w-0"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
