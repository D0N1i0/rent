// src/app/(public)/cancellation-policy/page.tsx
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LegalPageContent } from "@/components/pages/legal-page-content";
import { getPublicSettings } from "@/lib/settings";
import { getServerLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "cancellation-policy" } });
  return {
    title: seo?.title ?? "Cancellation & Refund Policy — AutoKos",
    description:
      seo?.description ??
      "AutoKos cancellation and refund policy for car rentals in Kosovo. Learn about cancellation deadlines, refund conditions, and how to cancel your booking.",
    alternates: { canonical: "/cancellation-policy" },
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Cancellation & Refund Policy — AutoKos",
      description: seo?.ogDescription ?? seo?.description ?? undefined,
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function CancellationPolicyPage() {
  const locale = await getServerLocale();
  const slug = locale === "al" ? "cancellation-policy-al" : "cancellation-policy";

  const [page, settings] = await Promise.all([
    prisma.legalPage.findUnique({ where: { slug } }),
    getPublicSettings(),
  ]);

  // Fall back to English if no Albanian version exists
  const resolvedPage =
    page ??
    (locale === "al"
      ? await prisma.legalPage.findUnique({ where: { slug: "cancellation-policy" } })
      : null);

  // If admin hasn't created this legal page yet, redirect to rental-policy which
  // contains cancellation terms. Admin should create a "cancellation-policy" LegalPage
  // via the admin panel before launch.
  if (!resolvedPage) {
    redirect("/rental-policy");
  }

  return (
    <LegalPageContent
      page={resolvedPage}
      locale={locale}
      whatsappNumber={settings.whatsappNumber}
      supportEmail={settings.supportEmail}
    />
  );
}
