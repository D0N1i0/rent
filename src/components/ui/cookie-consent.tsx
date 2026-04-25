"use client";
// Cookie consent banner — LPPD (Kosovo GDPR equivalent) compliance.
// Stores the user's choice in localStorage. Non-essential cookies/scripts
// must check this consent before initialising.
import { useState, useEffect } from "react";

const CONSENT_KEY = "cookie_consent";
const CONSENT_ACCEPTED = "accepted";
const CONSENT_REJECTED = "rejected";

export function useCookieConsent(): {
  hasConsented: boolean | null;
  accept: () => void;
  reject: () => void;
} {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === CONSENT_ACCEPTED) setHasConsented(true);
    else if (stored === CONSENT_REJECTED) setHasConsented(false);
    // null = not yet decided
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, CONSENT_ACCEPTED);
    setHasConsented(true);
  };

  const reject = () => {
    localStorage.setItem(CONSENT_KEY, CONSENT_REJECTED);
    setHasConsented(false);
  };

  return { hasConsented, accept, reject };
}

export function CookieConsent() {
  const { hasConsented, accept, reject } = useCookieConsent();
  // Detect locale from html lang attribute (set by LanguageProvider)
  const [locale, setLocale] = useState<"en" | "al">("en");

  useEffect(() => {
    const lang = document.documentElement.lang;
    if (lang === "al" || lang === "sq") setLocale("al");
  }, []);

  // Not yet resolved from localStorage — avoid flash
  if (hasConsented !== null) return null;

  const text = {
    en: {
      message:
        "We use cookies to improve your experience, remember your preferences, and analyse site traffic. By clicking «Accept», you agree to the use of cookies.",
      accept: "Accept All",
      reject: "Reject Non-Essential",
      learnMore: "Privacy Policy",
    },
    al: {
      message:
        "Ne përdorim cookie për të përmirësuar përvojën tuaj, për të ruajtur preferencat dhe për të analizuar trafikun e faqes. Duke klikuar «Pranoj», ju jeni dakord me përdorimin e cookie-ve.",
      accept: "Pranoj të Gjitha",
      reject: "Refuzo Jo-Thelbësoret",
      learnMore: "Politika e Privatësisë",
    },
  }[locale];

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1E3C] text-white shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 text-sm text-gray-200 leading-relaxed">
            <span className="mr-1">🍪</span>
            {text.message}{" "}
            <a
              href="/privacy"
              className="text-blue-300 hover:text-blue-200 underline underline-offset-2 ml-1"
            >
              {text.learnMore}
            </a>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={reject}
              className="text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 px-4 py-2 rounded-lg transition-colors"
            >
              {text.reject}
            </button>
            <button
              onClick={accept}
              className="text-sm bg-[#E63B2E] hover:bg-red-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors"
            >
              {text.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
