// src/app/(admin)/admin/dashboard/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { Calendar, Car, Users, TrendingUp, ArrowRight, Clock, AlertCircle } from "lucide-react";

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

  const stats = [
    { label: "Total Bookings", value: totalBookings, icon: Calendar, color: "text-blue-600 bg-blue-50", change: `${pendingBookings} pending` },
    { label: "Total Revenue", value: formatCurrency(totalRevenue._sum.totalAmount ?? 0), icon: TrendingUp, color: "text-green-600 bg-green-50", change: `${completedBookings} completed` },
    { label: "Fleet Size", value: totalCars, icon: Car, color: "text-purple-600 bg-purple-50", change: `${activeCars} active` },
    { label: "Customers", value: totalUsers, icon: Users, color: "text-orange-600 bg-orange-50", change: "registered" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all business operations and activity</p>
      </div>

      {/* Today's mini-stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-2 bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl p-4 text-white flex items-center gap-4">
          <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-300 font-medium uppercase tracking-wide">Today&apos;s Revenue</p>
            <p className="text-xl font-bold mt-0.5">{formatCurrency(todayRevenue._sum.totalAmount ?? 0)}</p>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-2 bg-gradient-to-br from-crimson-600 to-crimson-500 rounded-xl p-4 text-white flex items-center gap-4">
          <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-100 font-medium uppercase tracking-wide">Today&apos;s New Bookings</p>
            <p className="text-xl font-bold mt-0.5">{todayBookings}</p>
          </div>
        </div>
      </div>

      {/* Pending bookings alert */}
      {pendingBookings > 0 && (
        <Link
          href="/admin/bookings?status=PENDING"
          className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">
                {pendingBookings} booking{pendingBookings !== 1 ? "s" : ""} awaiting review
              </p>
              <p className="text-sm text-yellow-700">Click to review and confirm pending bookings</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-yellow-600 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-navy-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Booking status overview */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending", count: pendingBookings, color: "bg-yellow-50 text-yellow-700 border-yellow-200", href: "/admin/bookings?status=PENDING" },
          { label: "Confirmed", count: confirmedBookings, color: "bg-blue-50 text-blue-700 border-blue-200", href: "/admin/bookings?status=CONFIRMED" },
          { label: "Completed", count: completedBookings, color: "bg-green-50 text-green-700 border-green-200", href: "/admin/bookings?status=COMPLETED" },
          { label: "Total", count: totalBookings, color: "bg-gray-50 text-gray-700 border-gray-200", href: "/admin/bookings" },
        ].map(({ label, count, color, href }) => (
          <Link key={label} href={href} className={`rounded-xl border p-4 text-center ${color} hover:opacity-80 transition-opacity`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-1">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-navy-900">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-crimson-500 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentBookings.map((booking) => (
              <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="block px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-navy-900 truncate group-hover:text-crimson-600 transition-colors">
                        {booking.guestFirstName} {booking.guestLastName}
                      </span>
                      <span className={`status-badge text-[10px] ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                      <Car className="h-3 w-3 shrink-0" /> {booking.car.name} · {booking.pickupLocation.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-navy-900">{formatCurrency(booking.totalAmount)}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(booking.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-navy-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/admin/cars/new", label: "Add New Car" },
                { href: "/admin/bookings?status=PENDING", label: "Review Pending Bookings" },
                { href: "/admin/offers", label: "Create Offer" },
                { href: "/admin/settings", label: "Business Settings" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-navy-50 text-sm text-gray-700 hover:text-navy-900 transition-colors font-medium">
                  {label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-navy-900 mb-3">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-navy-900 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
