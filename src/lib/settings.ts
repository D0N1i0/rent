// src/lib/settings.ts
import { prisma } from "@/lib/prisma";

type SettingRecord = { key: string; value: string };

export interface PublicSettings {
  businessName: string;
  businessTagline: string;
  businessDescription: string;
  phone: string;
  phone2: string;
  supportEmail: string;
  address: string;
  googleMapsUrl: string;
  footerTagline: string;
  whatsappNumber: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  supportLabel: string;
  topbarNotice: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  bookingAdvanceHours: number;
  cancellationFreeHours: number;
}

const ALL_KEYS = [
  "business_name", "business_tagline", "business_description",
  "contact_phone", "contact_phone_2", "contact_email", "contact_address",
  "footer_about", "footer_tagline",
  "whatsapp_number",
  "facebook_url", "social_facebook",
  "instagram_url", "social_instagram",
  "social_tiktok", "tiktok_url",
  "youtube_url", "social_youtube",
  "support_hours", "support_label",
  "topbar_notice",
  "logo_url", "favicon_url",
  "primary_color", "accent_color",
  "google_maps_embed",
  "booking_advance_hours",
  "cancellation_free_hours",
  // Legacy keys
  "phone", "support_email", "address",
];

export async function getPublicSettings(): Promise<PublicSettings> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ALL_KEYS } },
  });

  const m = Object.fromEntries(rows.map((r: SettingRecord) => [r.key, r.value]));

  return {
    businessName: m.business_name || "AutoKos",
    businessTagline: m.business_tagline || "Premium Car Rental in Kosovo",
    businessDescription:
      m.business_description ||
      "Kosovo's most trusted car rental service. Transparent pricing, clean vehicles, and 24/7 support.",
    phone: m.contact_phone || m.phone || "+383 44 123 456",
    phone2: m.contact_phone_2 || "",
    supportEmail: m.contact_email || m.support_email || "info@autokos.com",
    address:
      m.contact_address || m.address || "Rr. Nënë Tereza, Nr. 45, Prishtinë 10000, Kosovo",
    googleMapsUrl:
      m.google_maps_embed || "https://maps.google.com/?q=Prishtina+Kosovo",
    footerTagline:
      m.footer_about ||
      m.footer_tagline ||
      "Kosovo's trusted car rental service. Transparent pricing, clean vehicles, and 24/7 support.",
    whatsappNumber: (
      m.whatsapp_number || "38344123456"
    ).replace(/\D/g, ""),
    facebookUrl:
      m.social_facebook || m.facebook_url || "https://facebook.com/autokos",
    instagramUrl:
      m.social_instagram || m.instagram_url || "https://instagram.com/autokos",
    tiktokUrl:
      m.social_tiktok || m.tiktok_url || "",
    youtubeUrl:
      m.social_youtube || m.youtube_url || "",
    supportLabel:
      m.support_hours || m.support_label || "24/7 Support Available",
    topbarNotice: m.topbar_notice || "✈ Airport Pickup Available",
    primaryColor: m.primary_color || "#0F1E3C",
    accentColor: m.accent_color || "#E63B2E",
    logoUrl: m.logo_url || "",
    bookingAdvanceHours: Number(m.booking_advance_hours ?? 2),
    cancellationFreeHours: Number(m.cancellation_free_hours ?? 48),
  };
}

/** Get a single setting by key with a fallback default. */
export async function getSetting(key: string, fallback = ""): Promise<string> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}
