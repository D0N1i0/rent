"use client";
// src/lib/i18n/context.tsx
// Language context: provides the current locale and translation helper to all client components.
// Language persists via localStorage and is immediately reflected without a page reload.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type Locale } from "./translations";

const STORAGE_KEY = "autokos_lang";
const DEFAULT_LOCALE: Locale = "en";

// Use the EN translations as the canonical shape so all components get well-typed strings
type T = typeof translations.en;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: T;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: translations[DEFAULT_LOCALE] as T,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Restore language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "al" || stored === "en") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    // Update <html lang=""> attribute for accessibility
    document.documentElement.lang = newLocale === "al" ? "sq" : "en";
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] as T }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Use inside any client component to access translations and locale. */
export function useLanguage() {
  return useContext(LanguageContext);
}

/** Convenience hook — returns only the `t` translation object. */
export function useT(): T {
  return useContext(LanguageContext).t;
}
