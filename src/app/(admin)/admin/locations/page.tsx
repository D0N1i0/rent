// src/app/(admin)/admin/locations/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { LocationsAdminClient } from "@/components/admin/locations-admin-client";

export default async function AdminLocationsPage() {
  const locations = await prisma.location.findMany({ orderBy: { sortOrder: "asc" } });
  return <LocationsAdminClient locations={locations} />;
}
