import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  // Settings is a high-privilege operation — restrict to ADMIN only (not STAFF)
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

const ALLOWED_SETTING_KEYS = new Set([
  "business_name", "business_tagline", "business_description",
  "contact_phone", "contact_phone_2", "contact_email", "contact_address",
  "footer_about", "footer_tagline",
  "whatsapp_number",
  "social_facebook", "social_instagram", "social_tiktok", "social_youtube",
  "support_hours", "support_label", "topbar_notice",
  "logo_url", "favicon_url", "primary_color", "accent_color",
  "google_maps_embed",
  "booking_advance_hours", "cancellation_free_hours",
  // Homepage sections
  "hero_title", "hero_subtitle", "hero_image",
  "contact_cta_title", "contact_cta_subtitle",
  "airport_title", "airport_subtitle",
  "why_title", "why_subtitle",
  "how_title",
  // Legal/SEO
  "meta_title", "meta_description",
]);

const MAX_VALUE_LENGTH = 5000;

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { settings } = await req.json();
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Filter + validate against whitelist
    const filteredSettings: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings as Record<string, unknown>)) {
      if (!ALLOWED_SETTING_KEYS.has(key)) continue; // silently skip unknown keys
      const strVal = String(value ?? "").slice(0, MAX_VALUE_LENGTH);
      filteredSettings[key] = strVal;
    }

    if (Object.keys(filteredSettings).length === 0) {
      return NextResponse.json({ error: "No valid settings keys provided" }, { status: 400 });
    }

    const updates = Object.entries(filteredSettings).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          group:
            key.startsWith("hero_") ||
            key.startsWith("contact_cta_") ||
            key.startsWith("airport_") ||
            key.startsWith("why_") ||
            key.startsWith("how_")
              ? "homepage"
              : key.startsWith("footer_")
              ? "footer"
              : "general",
        },
      })
    );

    await Promise.all(updates);
    await prisma.activityLog.create({
      data: { userId: session.user.id, action: "SETTINGS_UPDATED", entity: "SiteSetting", details: { updatedKeys: Object.keys(filteredSettings) } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const settings = await prisma.siteSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  return NextResponse.json({ settings });
}
