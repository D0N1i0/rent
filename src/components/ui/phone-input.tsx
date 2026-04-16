// src/components/ui/phone-input.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
}

/** Parse a stored phone value like "+383 44 123 456" into dial code + local number. */
function parsePhone(value: string): { dialCode: string; local: string } {
  if (!value) return { dialCode: DEFAULT_COUNTRY.dialCode, local: "" };

  // Try to match a known dial code at the start
  if (value.startsWith("+")) {
    // Sort by length desc to match longer codes first (e.g. +383 before +38)
    const sorted = [...COUNTRIES].sort(
      (a, b) => b.dialCode.length - a.dialCode.length
    );
    for (const c of sorted) {
      if (value.startsWith(c.dialCode)) {
        const local = value.slice(c.dialCode.length).trim();
        return { dialCode: c.dialCode, local };
      }
    }
    // Unrecognised dial code – extract it
    const spaceIdx = value.indexOf(" ");
    if (spaceIdx > 0) {
      return {
        dialCode: value.slice(0, spaceIdx),
        local: value.slice(spaceIdx + 1),
      };
    }
    return { dialCode: DEFAULT_COUNTRY.dialCode, local: value };
  }

  return { dialCode: DEFAULT_COUNTRY.dialCode, local: value };
}

export function PhoneInput({
  value,
  onChange,
  error,
  id = "phone",
  disabled,
  placeholder = "44 123 456",
}: PhoneInputProps) {
  const parsed = parsePhone(value);
  const [dialCode, setDialCode] = useState(parsed.dialCode);
  const [local, setLocal] = useState(parsed.local);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    const p = parsePhone(value);
    setDialCode(p.dialCode);
    setLocal(p.local);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const combined = local ? `${dialCode} ${local}` : "";

  const handleDialChange = (code: string) => {
    setDialCode(code);
    setOpen(false);
    setSearch("");
    onChange(local ? `${code} ${local}` : "");
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip everything except digits and spaces
    const raw = e.target.value.replace(/[^\d\s]/g, "");
    setLocal(raw);
    onChange(raw ? `${dialCode} ${raw}` : "");
  };

  const selectedCountry =
    COUNTRIES.find((c) => c.dialCode === dialCode) ?? DEFAULT_COUNTRY;

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dialCode.includes(search)
      )
    : COUNTRIES;

  // Close dropdown on outside click
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
      <div className={cn("flex rounded-xl border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-navy-900/30 transition-shadow", error ? "border-red-400" : "border-gray-200")}>
        {/* Country code selector */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 px-3 py-2.5 h-full bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 min-w-[80px]"
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="text-xs">{dialCode}</span>
            <ChevronDown className={cn("h-3 w-3 text-gray-400 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
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
                      onClick={() => handleDialChange(c.dialCode)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors",
                        c.dialCode === dialCode && "bg-navy-50 text-navy-900 font-medium"
                      )}
                    >
                      <span className="text-base leading-none w-5 text-center">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-gray-400 text-xs shrink-0">{c.dialCode}</span>
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

        {/* Local number input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={local}
          onChange={handleLocalChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none placeholder:text-gray-400 min-w-0"
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
