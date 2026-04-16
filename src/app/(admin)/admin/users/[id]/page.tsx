// src/app/(admin)/admin/users/[id]/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserDetailClient } from "@/components/admin/user-detail-client";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          car: { select: { name: true } },
          pickupLocation: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { bookings: true } },
    },
  });

  if (!user) notFound();

  return <UserDetailClient user={user} />;
}
