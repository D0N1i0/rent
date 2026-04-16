// src/app/(admin)/admin/offers/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { OffersAdminClient } from "@/components/admin/offers-admin-client";

export default async function AdminOffersPage() {
  const offers = await prisma.offer.findMany({ orderBy: { sortOrder: "asc" } });
  return <OffersAdminClient offers={offers} />;
}
