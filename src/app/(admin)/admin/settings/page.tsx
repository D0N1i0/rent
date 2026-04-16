// src/app/(admin)/admin/settings/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/admin/settings-client";

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  const settingsMap: Record<string, string> = {};
  settings.forEach(s => { settingsMap[s.key] = s.value; });

  const groups = ["business", "contact", "branding", "social", "homepage", "booking", "footer"];
  const grouped = groups.map(g => ({
    group: g,
    items: settings.filter(s => s.group === g),
  })).filter(g => g.items.length > 0);

  return <SettingsClient grouped={grouped} />;
}
