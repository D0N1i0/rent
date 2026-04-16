// src/components/ui/country-select.tsx
"use client";

import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  /** "name" returns country name (e.g. "Germany"), "nationality" returns adjective (e.g. "German") */
  valueType?: "name" | "nationality";
}

export function CountrySelect({
  value,
  onChange,
  error,
  id,
  placeholder = "Select country",
  disabled,
  valueType = "name",
}: CountrySelectProps) {
  const options = COUNTRIES.map((c) => ({
    label: c.name,
    value: valueType === "nationality" ? c.nationality : c.name,
    code: c.code,
    flag: c.flag,
  }));

  return (
    <div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "form-input appearance-none",
          error && "border-red-400",
          !value && "text-gray-400"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.code} value={opt.value}>
            {opt.flag} {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
