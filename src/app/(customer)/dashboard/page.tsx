// src/app/(customer)/dashboard/page.tsx
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicSettings } from "@/lib/settings";
import { DashboardOverviewClient } from "@/components/dashboard/dashboard-overview-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  const uid = session.user.id;
  const [user, recentBookings, total, active, completed, pendingCount, confirmedCount, settings] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: uid },
        select: { firstName: true, lastName: true, email: true, phone: true, licenseNumber: true },
      }),
      prisma.booking.findMany({
        where: { userId: uid },
        select: {
          id: true, bookingRef: true, status: true, paymentStatus: true,
          pickupDateTime: true, dropoffDateTime: true, durationDays: true,
          totalAmount: true, createdAt: true,
          car: { select: { name: true, brand: true } },
          pickupLocation: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.booking.count({ where: { userId: uid } }),
      prisma.booking.count({ where: { userId: uid, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } } }),
      prisma.booking.count({ where: { userId: uid, status: "COMPLETED" } }),
      prisma.booking.count({ where: { userId: uid, status: "PENDING" } }),
      prisma.booking.count({ where: { userId: uid, status: { in: ["CONFIRMED", "IN_PROGRESS"] } } }),
      getPublicSettings(),
    ]);

  return (
    <DashboardOverviewClient
      user={user}
      bookings={recentBookings}
      total={total}
      active={active}
      completed={completed}
      pendingCount={pendingCount}
      confirmedCount={confirmedCount}
      whatsappNumber={settings.whatsappNumber}
    />
  );
}
