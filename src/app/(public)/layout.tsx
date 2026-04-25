export const dynamic = "force-dynamic";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SupportWidget } from "@/components/layout/support-widget";
import { getPublicSettings, type PublicSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS: PublicSettings = {
  businessName: "AutoKos",
  businessTagline: "Premium Car Rental in Kosovo",
  businessDescription: "Kosovo's trusted car rental service.",
  phone: "+383 49 181 884",
  phone2: "",
  supportEmail: "info@autokos.com",
  address: "Rr. Nënë Tereza, Nr. 45, Prishtinë 10000, Kosovo",
  googleMapsUrl: "https://maps.google.com/?q=Prishtina+Kosovo",
  footerTagline: "Kosovo's trusted car rental service.",
  whatsappNumber: "38349181884",
  facebookUrl: "https://facebook.com/autokos",
  instagramUrl: "https://instagram.com/autokos",
  tiktokUrl: "",
  youtubeUrl: "",
  supportLabel: "24/7 Support Available",
  topbarNotice: "✈ Airport Pickup Available",
  primaryColor: "#0F1E3C",
  accentColor: "#E63B2E",
  logoUrl: "",
  bookingAdvanceHours: 2,
  cancellationFreeHours: 48,
  businessNipt: "",
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    getPublicSettings().catch(() => DEFAULT_SETTINGS),
    prisma.carCategory
      .findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      })
      .catch(() => []),
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
