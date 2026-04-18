import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Settings are ADMIN-only — STAFF must not be able to change site-wide config.
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { settings } = await req.json();
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const updates = Object.entries(settings as Record<string, string>).map(([key, value]) =>
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
      data: { userId: session.user.id, action: "SETTINGS_UPDATED", entity: "SiteSetting", details: { updatedKeys: Object.keys(settings) } },
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
