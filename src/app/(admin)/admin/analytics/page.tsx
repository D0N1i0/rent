// src/app/(admin)/admin/analytics/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/authz";
import { formatCurrency } from "@/lib/utils";
import { toNumber } from "@/lib/money";
import Link from "next/link";
import { TrendingUp, Car, Users, Calendar, Download, ArrowLeft } from "lucide-react";
import { subDays, subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role as string)) redirect("/login");

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    // Revenue stats
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    last30Revenue,
    // Booking counts
    totalBookings,
    thisMonthBookings,
    last30Bookings,
    prev30Bookings,
    completedBookings,
    cancelledBookings,
    pendingBookings,
    // Fleet
    totalCars,
    activeCars,
    // Customers
    totalCustomers,
    newCustomersThisMonth,
    // Payment status breakdown
    paidBookings,
    unpaidBookings,
    // Most rented cars
    topCars,
    // Average booking value
    avgBooking,
    // Recent months revenue
    last6MonthsBookings,
  ] = await Promise.all([
    // Total revenue (confirmed + completed)
    prisma.booking.aggregate({
      where: { status: { in: ["CONFIRMED", "COMPLETED", "IN_PROGRESS"] } },
      _sum: { totalAmount: true },
    }),
    // This month revenue
    prisma.booking.aggregate({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED", "IN_PROGRESS"] },
        createdAt: { gte: thisMonthStart },
      },
      _sum: { totalAmount: true },
    }),
    // Last month revenue
    prisma.booking.aggregate({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED", "IN_PROGRESS"] },
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { totalAmount: true },
    }),
    // Last 30 days revenue
    prisma.booking.aggregate({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED", "IN_PROGRESS"] },
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { totalAmount: true },
    }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.car.count(),
    prisma.car.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: thisMonthStart } } }),
    prisma.booking.count({ where: { paymentStatus: "PAID" } }),
    prisma.booking.count({ where: { paymentStatus: "UNPAID" } }),
    // Top 10 most-rented cars
    prisma.booking.groupBy({
      by: ["carId"],
      _count: { carId: true },
      _sum: { totalAmount: true, durationDays: true },
      where: { status: { in: ["CONFIRMED", "COMPLETED", "IN_PROGRESS"] } },
      orderBy: { _count: { carId: "desc" } },
      take: 10,
    }),
    // Average booking value
    prisma.booking.aggregate({
      where: { status: { in: ["CONFIRMED", "COMPLETED", "IN_PROGRESS"] } },
      _avg: { totalAmount: true },
    }),
    // Bookings per month (last 6 months)
    prisma.booking.findMany({
      where: { createdAt: { gte: subMonths(now, 6) } },
      select: { createdAt: true, totalAmount: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Enrich top cars with car info
  const carIds = topCars.map((c) => c.carId);
  const carDetails = await prisma.car.findMany({
    where: { id: { in: carIds } },
    select: { id: true, name: true, brand: true, isActive: true },
  });
  const carMap = Object.fromEntries(carDetails.map((c) => [c.id, c]));

  // Calculate month-over-month change
  const lastMonthAmt = toNumber(lastMonthRevenue._sum.totalAmount);
  const thisMonthAmt = toNumber(thisMonthRevenue._sum.totalAmount);
  const revenueChange =
    lastMonthAmt > 0
      ? ((thisMonthAmt - lastMonthAmt) / lastMonthAmt) * 100
      : null;

  const bookingsChange =
    prev30Bookings > 0
      ? (((last30Bookings - prev30Bookings) / prev30Bookings) * 100).toFixed(0)
      : null;

  // Group bookings by month for mini chart
  const monthlyData: Record<string, { bookings: number; revenue: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const key = format(d, "MMM yyyy");
    monthlyData[key] = { bookings: 0, revenue: 0 };
  }
  for (const b of last6MonthsBookings) {
    const key = format(new Date(b.createdAt), "MMM yyyy");
    if (monthlyData[key]) {
      monthlyData[key].bookings += 1;
      if (["CONFIRMED", "COMPLETED", "IN_PROGRESS"].includes(b.status)) {
        monthlyData[key].revenue += toNumber(b.totalAmount);
      }
    }
  }

  const cancellationRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Analytics & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Business overview — all figures are live from database</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/admin/export/bookings"
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Bookings CSV
          </a>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(totalRevenue._sum.totalAmount ?? 0),
            sub: `This month: ${formatCurrency(thisMonthRevenue._sum.totalAmount ?? 0)}`,
            icon: TrendingUp,
            color: "text-green-600 bg-green-50",
            change: revenueChange != null ? `${revenueChange > 0 ? "+" : ""}${revenueChange.toFixed(0)}% vs last month` : null,
            positive: revenueChange != null && revenueChange >= 0,
          },
          {
            label: "Total Bookings",
            value: totalBookings,
            sub: `This month: ${thisMonthBookings}`,
            icon: Calendar,
            color: "text-blue-600 bg-blue-50",
            change: bookingsChange ? `${Number(bookingsChange) > 0 ? "+" : ""}${bookingsChange}% vs prev 30d` : null,
            positive: bookingsChange != null && Number(bookingsChange) >= 0,
          },
          {
            label: "Active Fleet",
            value: `${activeCars}/${totalCars}`,
            sub: `${totalCars - activeCars} inactive`,
            icon: Car,
            color: "text-purple-600 bg-purple-50",
            change: null,
            positive: true,
          },
          {
            label: "Total Customers",
            value: totalCustomers,
            sub: `+${newCustomersThisMonth} this month`,
            icon: Users,
            color: "text-orange-600 bg-orange-50",
            change: null,
            positive: true,
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-navy-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            {card.change && (
              <p className={`text-xs font-medium mt-1 ${card.positive ? "text-green-600" : "text-red-500"}`}>
                {card.change}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Booking status breakdown */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Completed", count: completedBookings, color: "bg-green-50 text-green-700 border-green-200", href: "/admin/bookings?status=COMPLETED" },
          { label: "Cancelled", count: cancelledBookings, color: "bg-red-50 text-red-700 border-red-200", href: "/admin/bookings?status=CANCELLED" },
          { label: "Pending", count: pendingBookings, color: "bg-yellow-50 text-yellow-700 border-yellow-200", href: "/admin/bookings?status=PENDING" },
          { label: "Cancellation Rate", count: `${cancellationRate}%`, color: "bg-gray-50 text-gray-700 border-gray-200", href: "/admin/bookings" },
        ].map(({ label, count, color, href }) => (
          <Link key={label} href={href} className={`rounded-xl border p-4 text-center ${color} hover:opacity-80 transition-opacity`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-1">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payment status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-navy-900 mb-4">Payment Status</h2>
          <div className="space-y-3">
            {[
              { label: "Paid", count: paidBookings, pct: totalBookings > 0 ? (paidBookings / totalBookings) * 100 : 0, color: "bg-green-500" },
              { label: "Unpaid", count: unpaidBookings, pct: totalBookings > 0 ? (unpaidBookings / totalBookings) * 100 : 0, color: "bg-yellow-400" },
              { label: "Other", count: totalBookings - paidBookings - unpaidBookings, pct: totalBookings > 0 ? ((totalBookings - paidBookings - unpaidBookings) / totalBookings) * 100 : 0, color: "bg-gray-300" },
            ].map(({ label, count, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Average booking value: <span className="font-bold text-navy-900">{formatCurrency(avgBooking._avg.totalAmount ?? 0)}</span>
            </p>
          </div>
        </div>

        {/* Monthly overview */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-navy-900 mb-4">Monthly Overview (Last 6 Months)</h2>
          <div className="space-y-2">
            {Object.entries(monthlyData).map(([month, data]) => (
              <div key={month} className="flex items-center gap-3 text-sm">
                <span className="w-20 text-gray-500 shrink-0">{month}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-navy-700 rounded"
                    style={{
                      width: data.bookings > 0
                        ? `${Math.max(4, (data.bookings / Math.max(...Object.values(monthlyData).map(d => d.bookings), 1)) * 100)}%`
                        : "0%"
                    }}
                  />
                </div>
                <span className="w-12 text-right font-medium text-navy-900">{data.bookings}</span>
                <span className="w-24 text-right text-green-600 font-medium">{formatCurrency(data.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top vehicles */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-navy-900">Top Rented Vehicles</h2>
          <Link href="/admin/cars" className="text-sm text-crimson-500 hover:underline">Manage fleet</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Bookings</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total Days</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topCars.map((row, i) => {
                const car = carMap[row.carId];
                return (
                  <tr key={row.carId} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-navy-900">{car?.name ?? row.carId}</p>
                      {!car?.isActive && <span className="text-xs text-red-500">Inactive</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-navy-900">{row._count.carId}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{row._sum.durationDays ?? 0}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">{formatCurrency(row._sum.totalAmount ?? 0)}</td>
                  </tr>
                );
              })}
              {topCars.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No bookings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/admin/bookings" className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors group">
          <Calendar className="h-8 w-8 text-blue-500 shrink-0" />
          <div>
            <p className="font-semibold text-navy-900 group-hover:text-crimson-600">View All Bookings</p>
            <p className="text-xs text-gray-400">Manage and filter all reservations</p>
          </div>
        </Link>
        <a href="/api/admin/export/bookings" className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors group">
          <Download className="h-8 w-8 text-green-500 shrink-0" />
          <div>
            <p className="font-semibold text-navy-900 group-hover:text-crimson-600">Export CSV Report</p>
            <p className="text-xs text-gray-400">All bookings with pricing, dates, and customer info</p>
          </div>
        </a>
      </div>
    </div>
  );
}
