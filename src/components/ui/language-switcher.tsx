"use client";
// src/components/ui/language-switcher.tsx
// AL / EN language toggle button shown in the site header.

import { useLanguage } from "@/lib/i18n/context";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 bg-white/10 rounded-md overflow-hidden text-xs font-semibold" role="group" aria-label="Language selector">
      <button
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`px-2 py-1 transition-colors ${
          locale === "en"
            ? "bg-crimson-500 text-white"
            : "text-white/70 hover:text-white hover:bg-white/10"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("al")}
        aria-pressed={locale === "al"}
        className={`px-2 py-1 transition-colors ${
          locale === "al"
            ? "bg-crimson-500 text-white"
            : "text-white/70 hover:text-white hover:bg-white/10"
        }`}
      >
        AL
      </button>
    </div>
  );
}
