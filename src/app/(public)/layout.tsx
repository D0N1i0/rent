export const dynamic = "force-dynamic";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SupportWidget } from "@/components/layout/support-widget";
import { getPublicSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    getPublicSettings(),
    prisma.carCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} categories={categories} />
      <SupportWidget
        whatsappNumber={settings.whatsappNumber}
        phone={settings.phone}
        supportEmail={settings.supportEmail}
      />
    </div>
  );
}
