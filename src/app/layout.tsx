// src/app/layout.tsx
import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LanguageProvider } from "@/lib/i18n/context";
import { CookieConsent } from "@/components/ui/cookie-consent";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AutoKos — Makina me Qira Kosovo | Car Rental Kosovo",
    template: "%s | AutoKos Kosovo",
  },
  description:
    "Kosovo's most trusted car rental — Vetura me qira Prishtinë. Modern fleet, airport pickup, transparent pricing. Book online in minutes.",
  keywords: [
    "car rental Kosovo",
    "rent a car Prishtina",
    "car hire Kosovo airport",
    "makina me qira Kosovë",
    "makina me qira Prishtinë",
    "vetura me qira Kosovë",
    "vetura me qira Prishtinë",
    "rent a car Prishtina airport",
    "qira vetura Kosovë",
    "AutoKos",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AutoKos",
    description: "Kosovo's most trusted car rental — Vetura me qira Prishtinë. Airport pickup, modern fleet, transparent pricing.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-white text-gray-900">
        <AuthProvider>
          <LanguageProvider>
            {children}
            <Toaster />
            <CookieConsent />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
