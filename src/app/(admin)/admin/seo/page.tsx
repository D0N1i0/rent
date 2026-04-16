// src/app/(admin)/admin/seo/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { SeoAdminClient } from "@/components/admin/seo-admin-client";

const SEO_PAGES = [
  { key: "home", label: "Homepage" },
  { key: "fleet", label: "Fleet / Cars" },
  { key: "about", label: "About Us" },
  { key: "faq", label: "FAQ" },
  { key: "contact", label: "Contact" },
  { key: "airport-rental", label: "Airport Rental" },
  { key: "long-term", label: "Long-Term Rental" },
  { key: "terms", label: "Terms & Conditions" },
  { key: "privacy", label: "Privacy Policy" },
  { key: "insurance", label: "Insurance" },
  { key: "rental-policy", label: "Rental Policy" },
];

export default async function AdminSeoPage() {
  const seoRecords = await prisma.seoMetadata.findMany({
    where: { page: { in: SEO_PAGES.map((p) => p.key) } },
  });

  const seoMap = Object.fromEntries(seoRecords.map((r: { page: string; id: string; title?: string | null; description?: string | null; keywords?: string | null; ogTitle?: string | null; ogDescription?: string | null }) => [r.page, r]));

  return <SeoAdminClient pages={SEO_PAGES} seoMap={seoMap} />;
}
