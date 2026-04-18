"use client";
import Link from "next/link";
import { Calendar, Car, Users, TrendingUp, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

interface RecentBooking {
  id: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  status: string;
  car: { name: string };
  pickupLocation: { name: string };
  totalAmount: number;
  createdAt: Date;
}

interface RecentActivity {
  id: string;
  action: string;
  createdAt: Date;
}

interface AdminDashboardClientProps {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  totalRevenue: number;
  totalCars: number;
  activeCars: number;
  totalUsers: number;
  todayRevenue: number;
  todayBookings: number;
  recentBookings: RecentBooking[];
  recentActivity: RecentActivity[];
  cancelledButPaid: number;
  completedButUnpaid: number;
  webhookFailures: number;
}

export function AdminDashboardClient({
  totalBookings,
  pendingBookings,
  confirmedBookings,
  completedBookings,
  totalRevenue,
  totalCars,
  activeCars,
  totalUsers,
  todayRevenue,
  todayBookings,
  recentBookings,
  recentActivity,
  cancelledButPaid,
  completedButUnpaid,
  webhookFailures,
}: AdminDashboardClientProps) {
  const { locale, t } = useLanguage();

  const stats = [
    { label: t.admin.totalBookings, value: totalBookings, icon: Calendar, color: "text-blue-600 bg-blue-50", change: `${pendingBookings} ${t.admin.pending.toLowerCase()}` },
    { label: t.admin.totalRevenue, value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-green-600 bg-green-50", change: `${completedBookings} ${t.admin.completed.toLowerCase()}` },
    { label: t.admin.fleetSize, value: totalCars, icon: Car, color: "text-purple-600 bg-purple-50", change: `${activeCars} ${t.admin.active}` },
    { label: t.admin.customers, value: totalUsers, icon: Users, color: "text-orange-600 bg-orange-50", change: t.admin.registered },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t.admin.dashboard}</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all business operations and activity</p>
      </div>

      {/* Today's mini-stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-2 bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl p-4 text-white flex items-center gap-4">
          <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-300 font-medium uppercase tracking-wide">{t.admin.todaysRevenue}</p>
            <p className="text-xl font-bold mt-0.5">{formatCurrency(todayRevenue)}</p>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-2 bg-gradient-to-br from-crimson-600 to-crimson-500 rounded-xl p-4 text-white flex items-center gap-4">
          <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-100 font-medium uppercase tracking-wide">{t.admin.todaysBookings}</p>
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
                {pendingBookings} {locale === "al" ? "rezervime" : `booking${pendingBookings !== 1 ? "s" : ""}`} {t.admin.awaitingReview}
              </p>
              <p className="text-sm text-yellow-700">{t.admin.awaitingReviewClick}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-yellow-600 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
      )}

      {/* Payment anomaly alerts — require operator action */}
      {(cancelledButPaid > 0 || completedButUnpaid > 0 || webhookFailures > 0) && (
        <div className="space-y-2">
          {cancelledButPaid > 0 && (
            <Link
              href="/admin/bookings?status=CANCELLED"
              className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">
                    {cancelledButPaid} cancelled booking{cancelledButPaid !== 1 ? "s" : ""} with unpaid refund
                  </p>
                  <p className="text-sm text-red-700">Customer paid but booking was cancelled — refund required</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-red-600 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          )}
          {completedButUnpaid > 0 && (
            <Link
              href="/admin/bookings?status=COMPLETED"
              className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-4 hover:bg-orange-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                <div>
                  <p className="font-semibold text-orange-800">
                    {completedButUnpaid} completed booking{completedButUnpaid !== 1 ? "s" : ""} still unpaid
                  </p>
                  <p className="text-sm text-orange-700">Booking completed but payment not recorded</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-orange-600 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          )}
          {webhookFailures > 0 && (
            <Link
              href="/admin/activity-log?action=WEBHOOK_PROCESSING_FAILED"
              className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl p-4 hover:bg-purple-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-purple-600 shrink-0" />
                <div>
                  <p className="font-semibold text-purple-800">
                    {webhookFailures} webhook failure{webhookFailures !== 1 ? "s" : ""} in the last 7 days
                  </p>
                  <p className="text-sm text-purple-700">Stripe webhook events failed processing — check activity log</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          )}
        </div>
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
          { label: t.admin.pending, count: pendingBookings, color: "bg-yellow-50 text-yellow-700 border-yellow-200", href: "/admin/bookings?status=PENDING" },
          { label: t.admin.confirmed, count: confirmedBookings, color: "bg-blue-50 text-blue-700 border-blue-200", href: "/admin/bookings?status=CONFIRMED" },
          { label: t.admin.completed, count: completedBookings, color: "bg-green-50 text-green-700 border-green-200", href: "/admin/bookings?status=COMPLETED" },
          { label: t.admin.total, count: totalBookings, color: "bg-gray-50 text-gray-700 border-gray-200", href: "/admin/bookings" },
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
            <h2 className="font-bold text-navy-900">{t.admin.recentBookings}</h2>
            <Link href="/admin/bookings" className="text-sm text-crimson-500 hover:underline flex items-center gap-1">
              {t.admin.viewAll} <ArrowRight className="h-3.5 w-3.5" />
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
            <h2 className="font-bold text-navy-900 mb-4">{t.admin.quickActions}</h2>
            <div className="space-y-2">
              {[
                { href: "/admin/cars/new", label: t.admin.addNewCar },
                { href: "/admin/bookings?status=PENDING", label: t.admin.reviewPending },
                { href: "/admin/offers", label: t.admin.createOffer },
                { href: "/admin/settings", label: t.admin.businessSettings },
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
            <h2 className="font-bold text-navy-900 mb-3">{t.admin.recentActivity}</h2>
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
