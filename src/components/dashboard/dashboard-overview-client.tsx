"use client";
// src/components/dashboard/dashboard-overview-client.tsx
// Client component for the dashboard overview page — handles i18n translations.

import Link from "next/link";
import { Car, Calendar, ArrowRight, Clock, CheckCircle, Lock, User, AlertCircle, Home } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { useT } from "@/lib/i18n/context";

type Booking = {
  id: string;
  bookingRef: string;
  status: string;
  totalAmount: number;
  durationDays: number;
  pickupDateTime: Date;
  car: { name: string; brand: string };
  pickupLocation: { name: string };
};

type Props = {
  user: { firstName: string | null; lastName: string | null; email: string | null; phone: string | null; licenseNumber: string | null } | null;
  bookings: Booking[];
  total: number;
  active: number;
  completed: number;
  pendingCount: number;
  confirmedCount: number;
  whatsappNumber: string;
};

export function DashboardOverviewClient({
  user,
  bookings,
  total,
  active,
  completed,
  pendingCount,
  confirmedCount,
  whatsappNumber,
}: Props) {
  const t = useT();
  const profileComplete = !!(user?.phone && user?.licenseNumber);

  const quickLinks = [
    { href: "/fleet", label: t.nav.fleet, icon: Car, primary: true },
    { href: "/dashboard/bookings", label: t.dashboard.bookings, icon: Calendar },
    { href: "/dashboard/profile", label: t.dashboard.profile, icon: User },
    { href: "/dashboard/security", label: t.dashboard.security, icon: Lock },
  ];

  return (
    <div>
      {/* Hero header */}
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-1">
                <Home className="h-3.5 w-3.5" />
                <Link href="/" className="hover:text-crimson-500 transition-colors">{t.common.back}</Link>
              </p>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900">
                {user?.firstName ? `Welcome back, ${user.firstName}!` : t.dashboard.title}
              </h1>
              <p className="text-gray-500 mt-1">{t.dashboard.overview}</p>
            </div>
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:text-navy-900 transition-colors font-medium"
            >
              <Home className="h-4 w-4" />
              {t.common.back}
            </Link>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Profile incomplete banner */}
        {!profileComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">{t.profile.saveChanges}</p>
                <p className="text-amber-700 text-xs mt-0.5">{t.profile.drivingInfo}</p>
              </div>
            </div>
            <Link href="/dashboard/profile" className="btn-primary text-sm px-4 py-2 shrink-0">{t.profile.title}</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: t.dashboard.bookings, value: total, icon: Calendar, color: "bg-blue-50 text-blue-600" },
            { label: t.dashboard.upcomingBookings, value: active, icon: Car, color: "bg-green-50 text-green-600" },
            { label: t.dashboard.status.COMPLETED, value: completed, icon: CheckCircle, color: "bg-purple-50 text-purple-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status breakdown (only shown when there are bookings) */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: t.dashboard.status.PENDING, count: pendingCount, color: "bg-yellow-50 text-yellow-700 border-yellow-200", href: "/dashboard/bookings?status=PENDING" },
              { label: t.dashboard.status.CONFIRMED, count: confirmedCount, color: "bg-blue-50 text-blue-700 border-blue-200", href: "/dashboard/bookings?status=CONFIRMED" },
              { label: t.dashboard.status.COMPLETED, count: completed, color: "bg-green-50 text-green-700 border-green-200", href: "/dashboard/bookings?status=COMPLETED" },
            ].map(({ label, count, color, href }) => (
              <Link key={label} href={href} className={`rounded-xl border p-3 text-center ${color} hover:opacity-80 transition-opacity`}>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs font-medium mt-0.5">{label}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-navy-900">{t.dashboard.recentBookings}</h2>
                <Link href="/dashboard/bookings" className="text-sm text-crimson-500 hover:underline font-medium flex items-center gap-1">
                  {t.common.viewAll} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {bookings.length === 0 ? (
                <div className="p-8 text-center">
                  <Car className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">{t.dashboard.noBookings}</p>
                  <p className="text-sm text-gray-400 mb-4">{t.dashboard.noBookingsDesc}</p>
                  <Link href="/fleet" className="btn-primary text-sm px-5 py-2.5">{t.dashboard.makeBooking}</Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {bookings.map((booking) => (
                    <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="block p-5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-navy-900 text-sm truncate">{booking.car.name}</p>
                            <span className={`status-badge text-xs ${getStatusColor(booking.status)}`}>
                              {t.dashboard.status[booking.status as keyof typeof t.dashboard.status] ?? booking.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(booking.pickupDateTime)} · {booking.pickupLocation.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{booking.bookingRef}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-navy-900 text-sm">{formatCurrency(booking.totalAmount)}</p>
                          <p className="text-xs text-gray-400">{booking.durationDays}d</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Browse Cars CTA */}
            <div className="mt-4 bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="text-white">
                <p className="font-bold">{t.dashboard.makeBooking}</p>
                <p className="text-sm text-gray-300 mt-0.5">{t.dashboard.noBookingsDesc}</p>
              </div>
              <Link href="/fleet" className="shrink-0 flex items-center gap-2 bg-crimson-500 hover:bg-crimson-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                <Car className="h-4 w-4" />
                {t.nav.fleet}
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-navy-900 mb-4">{t.dashboard.overview}</h2>
              <div className="space-y-2">
                {quickLinks.map(({ href, label, icon: Icon, primary }) => (
                  <Link key={href} href={href} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors ${primary ? "bg-navy-900 text-white hover:bg-navy-800" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-navy-900 rounded-2xl p-5 text-white">
              <p className="font-bold mb-1">{t.support.needHelp}</p>
              <p className="text-sm text-gray-300 mb-3">{t.support.whatsapp}</p>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {t.support.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
