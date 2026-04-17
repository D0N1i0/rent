// src/app/(public)/insurance/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { InsuranceClient } from "@/components/pages/insurance-client";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "insurance" } });
  return {
    title: seo?.title ?? "Insurance Coverage — AutoKos",
    description: seo?.description ?? "Learn about insurance coverage included with AutoKos car rentals in Kosovo.",
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Insurance Coverage — AutoKos",
      description: seo?.ogDescription ?? seo?.description ?? undefined,
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default function InsurancePage() {
  return <InsuranceClient />;
}
