// src/app/(admin)/admin/dashboard/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export default async function AdminDashboardPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    totalRevenue,
    totalCars,
    activeCars,
    totalUsers,
    recentBookings,
    recentActivity,
    todayRevenue,
    todayBookings,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.aggregate({ where: { status: { in: ["CONFIRMED", "COMPLETED"] } }, _sum: { totalAmount: true } }),
    prisma.car.count(),
    prisma.car.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.booking.findMany({
      include: {
        car: { select: { name: true } },
        pickupLocation: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.activityLog.findMany({
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.booking.aggregate({
      where: { status: { in: ["CONFIRMED", "COMPLETED"] }, createdAt: { gte: todayStart } },
      _sum: { totalAmount: true },
    }),
    prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
  ]);

  return (
    <AdminDashboardClient
      totalBookings={totalBookings}
      pendingBookings={pendingBookings}
      confirmedBookings={confirmedBookings}
      completedBookings={completedBookings}
      totalRevenue={totalRevenue._sum.totalAmount ?? 0}
      totalCars={totalCars}
      activeCars={activeCars}
      totalUsers={totalUsers}
      todayRevenue={todayRevenue._sum.totalAmount ?? 0}
      todayBookings={todayBookings}
      recentBookings={recentBookings}
      recentActivity={recentActivity}
    />
  );
}
