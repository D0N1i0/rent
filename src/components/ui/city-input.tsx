// src/components/ui/city-input.tsx
"use client";

import { useMemo } from "react";
import { COUNTRIES, getCitiesForCountry } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface CityInputProps {
  value: string;
  onChange: (value: string) => void;
  /** The currently selected country name (e.g. "Germany") */
  country: string;
  error?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function CityInput({
  value,
  onChange,
  country,
  error,
  id = "city",
  placeholder = "Enter city",
  disabled,
}: CityInputProps) {
  const countryCode = useMemo(() => {
    if (!country) return "";
    return COUNTRIES.find((c) => c.name === country)?.code ?? "";
  }, [country]);

  const cities = useMemo(() => getCitiesForCountry(countryCode), [countryCode]);
  const hasCities = cities.length > 0;

  // If we have a curated city list, show a select; otherwise free text with datalist
  if (hasCities) {
    return (
      <div>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn("form-input appearance-none", error && "border-red-400", !value && "text-gray-400")}
        >
          <option value="">{placeholder}</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
          <option value="__other__">Other city</option>
        </select>
        {/* If "Other city" is selected, show text input */}
        {value === "__other__" && (
          <input
            type="text"
            placeholder="Type your city..."
            className={cn("form-input mt-2", error && "border-red-400")}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  const listId = id ? `${id}-list` : undefined;

  return (
    <div>
      <input
        id={id}
        type="text"
        value={value === "__other__" ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        list={listId}
        autoComplete="off"
        className={cn("form-input", error && "border-red-400")}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
