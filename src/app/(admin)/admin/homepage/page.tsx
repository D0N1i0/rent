// src/app/(admin)/admin/homepage/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { HomepageAdminClient } from "@/components/admin/homepage-admin-client";

export default async function AdminHomepagePage() {
  const settings = await prisma.siteSetting.findMany({
    where: { group: "homepage" },
    orderBy: { key: "asc" },
  });

  const seoData = await prisma.seoMetadata.findMany({
    where: { page: { in: ["home"] } },
  });

  const settingsMap: Record<string, string> = {};
  settings.forEach(s => { settingsMap[s.key] = s.value; });

  const seoMap: Record<string, any> = {};
  seoData.forEach(s => { seoMap[s.page] = s; });

  return <HomepageAdminClient settings={settingsMap} seo={seoMap["home"] ?? null} />;
}
