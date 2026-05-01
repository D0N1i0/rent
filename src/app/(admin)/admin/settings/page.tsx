// src/app/(admin)/admin/settings/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/admin/settings-client";
import { AlertTriangle } from "lucide-react";

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  const settingsMap: Record<string, string> = {};
  settings.forEach(s => { settingsMap[s.key] = s.value; });

  const groups = ["business", "contact", "branding", "social", "homepage", "booking", "footer"];
  const grouped = groups.map(g => ({
    group: g,
    items: settings.filter(s => s.group === g),
  })).filter(g => g.items.length > 0);

  const nipt = settingsMap["business_nipt"] ?? "";
  const missingNipt = !nipt.trim();

  return (
    <div>
      {missingNipt && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm">
            <span className="font-semibold">Business NIPT is missing.</span>{" "}
            Kosovo law requires your tax registration number on invoices and legal documents.
            Add it below under <strong>Business</strong> before going live.
          </div>
        </div>
      )}
      <SettingsClient grouped={grouped} />
    </div>
  );
}
