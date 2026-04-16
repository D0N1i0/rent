// src/app/(public)/contact/page.tsx
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings";
import { ContactPageClient } from "@/components/pages/contact-page-client";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "contact" } });
  return {
    title: seo?.title ?? "Contact Us",
    description: seo?.description ?? "Get in touch with us for car rental enquiries, support or questions.",
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Contact Us",
      description: seo?.ogDescription ?? seo?.description ?? "Get in touch with us for car rental enquiries, support or questions.",
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function ContactPage() {
  const settings = await getPublicSettings();

  return (
    <ContactPageClient
      phone={settings.phone}
      email={settings.supportEmail}
      address={settings.address}
      whatsappNumber={settings.whatsappNumber}
      businessName={settings.businessName}
    />
  );
}
