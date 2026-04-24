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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, email: true, phone: true, licenseNumber: true },
  });

  const [bookings, statusCounts] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        car: { select: { name: true, brand: true } },
        pickupLocation: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    Promise.all([
      prisma.booking.count({ where: { userId: session.user.id } }),
      prisma.booking.count({ where: { userId: session.user.id, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } } }),
      prisma.booking.count({ where: { userId: session.user.id, status: "COMPLETED" } }),
      prisma.booking.count({ where: { userId: session.user.id, status: "PENDING" } }),
      prisma.booking.count({ where: { userId: session.user.id, status: { in: ["CONFIRMED", "IN_PROGRESS"] } } }),
    ]),
  ]);

  const [total, active, completed, pendingCount, confirmedCount] = statusCounts;
  const settings = await getPublicSettings();

  return (
    <DashboardOverviewClient
      user={user}
      bookings={bookings as unknown as { id: string; bookingRef: string; status: string; totalAmount: number; durationDays: number; pickupDateTime: Date; car: { name: string; brand: string }; pickupLocation: { name: string } }[]}
      total={total}
      active={active}
      completed={completed}
      pendingCount={pendingCount}
      confirmedCount={confirmedCount}
      whatsappNumber={settings.whatsappNumber}
    />
  );
}
