// src/app/(public)/about/page.tsx
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AboutClient } from "@/components/pages/about-client";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "about" } });
  return {
    title: seo?.title ?? "About Us",
    description: seo?.description ?? "Learn about AutoKos, Kosovo's most trusted car rental company based in Prishtina.",
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "About Us",
      description: seo?.ogDescription ?? seo?.description ?? "Learn about AutoKos, Kosovo's most trusted car rental company based in Prishtina.",
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default function AboutPage() {
  return <AboutClient />;
}
