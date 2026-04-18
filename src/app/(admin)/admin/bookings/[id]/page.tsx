// src/app/(admin)/admin/bookings/[id]/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDateTime, getStatusColor, getPaymentStatusColor } from "@/lib/utils";
import { BookingActionButtons } from "@/components/admin/booking-action-buttons";
import { BookingNotesEditor } from "@/components/admin/booking-notes-editor";
import { Car, MapPin, Calendar, User, CreditCard, ChevronLeft, Clock, AlertTriangle, Receipt } from "lucide-react";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      car: { include: { images: { where: { isPrimary: true } } } },
      pickupLocation: true,
      dropoffLocation: true,
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      },
      extras: { include: { extra: true } },
      statusHistory: {
        include: {
          changedBy: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!booking) notFound();

  // ── Payment activity & anomaly detection ──────────────────────────────────
  // Surfaces the full Stripe lifecycle (or gaps in it) so operators can
  // reconcile a booking without leaving the admin panel.
  const paymentActivity = await prisma.activityLog.findMany({
    where: {
      entity: "Booking",
      entityId: booking.id,
      action: {
        in: ["PAYMENT_RECEIVED", "PAYMENT_FAILED", "PAYMENT_REFUNDED", "PAYMENT_PARTIALLY_REFUNDED", "BOOKING_AUTO_CANCELLED"],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const anomalies: string[] = [];
  if (booking.status === "CANCELLED" && booking.paymentStatus === "PAID") {
    anomalies.push("Booking cancelled but payment not refunded — issue a refund or mark waived.");
  }
  if (booking.status === "COMPLETED" && booking.paymentStatus === "UNPAID") {
    anomalies.push("Booking completed but still unpaid — collect payment or mark waived.");
  }
  if (
    booking.stripePaymentIntentId &&
    booking.paymentStatus === "UNPAID" &&
    booking.createdAt < new Date(Date.now() - 60 * 60 * 1000)
  ) {
    anomalies.push("Payment intent created over an hour ago but booking still unpaid.");
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href="/admin/bookings"
          className="flex items-center gap-1.5 text-gray-500 hover:text-navy-900 text-sm mb-3 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Bookings
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">
              Booking{" "}
              <span className="font-mono text-crimson-600">{booking.bookingRef}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`status-badge ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
              <span className={`status-badge ${getPaymentStatusColor(booking.paymentStatus)}`}>
                {booking.paymentStatus}
              </span>
              {booking.pricingTier !== "daily" && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 capitalize">
                  {booking.pricingTier} rate
                </span>
              )}
            </div>
          </div>
          <BookingActionButtons
            bookingId={booking.id}
            currentStatus={booking.status}
            currentPaymentStatus={booking.paymentStatus}
          />
        </div>
      </div>

      {/* Payment anomalies — only renders when there is something to action */}
      {anomalies.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Payment anomalies detected</h3>
              <ul className="mt-1.5 space-y-1 text-sm text-amber-900">
                {anomalies.map((msg, i) => (
                  <li key={i} className="flex gap-2">
                    <span>•</span>
                    <span>{msg}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Customer */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-navy-900">Customer</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Name:</span>{" "}
              <span className="font-medium">
                {booking.guestFirstName} {booking.guestLastName}
              </span>
            </p>
            <p>
              <span className="text-gray-500">Email:</span>{" "}
              <a
                href={`mailto:${booking.guestEmail}`}
                className="font-medium text-crimson-600 hover:underline"
              >
                {booking.guestEmail}
              </a>
            </p>
            <p>
              <span className="text-gray-500">Phone:</span>{" "}
              <a
                href={`tel:${booking.guestPhone}`}
                className="font-medium hover:underline"
              >
                {booking.guestPhone}
              </a>
            </p>
            {booking.guestIdNumber && (
              <p>
                <span className="text-gray-500">ID/Passport:</span>{" "}
                <span className="font-medium">{booking.guestIdNumber}</span>
              </p>
            )}
            {booking.guestLicense && (
              <p>
                <span className="text-gray-500">Licence:</span>{" "}
                <span className="font-medium">{booking.guestLicense}</span>
              </p>
            )}
            {booking.user && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-green-600 font-medium">✓ Registered account</p>
                <Link
                  href={`/admin/users/${booking.user.id}`}
                  className="text-xs text-crimson-500 hover:underline"
                >
                  View user profile →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Car className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-navy-900">Vehicle</h2>
          </div>
          <div className="flex items-center gap-3 mb-3">
            {booking.car.images[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={booking.car.images[0].url}
                alt={booking.car.name}
                className="h-14 w-20 object-cover rounded-lg bg-gray-100"
              />
            ) : (
              <div className="h-14 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-gray-300" />
              </div>
            )}
            <div>
              <p className="font-semibold text-navy-900">{booking.car.name}</p>
              <p className="text-sm text-gray-500">{booking.car.year}</p>
            </div>
          </div>
          <div className="space-y-1.5 text-sm">
            {booking.damageNoted && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                <p className="text-xs font-semibold text-red-700">⚠ Damage Noted</p>
                {booking.damageDescription && (
                  <p className="text-xs text-red-600 mt-1">{booking.damageDescription}</p>
                )}
              </div>
            )}
            {booking.depositReturned && (
              <p className="text-xs text-green-600 font-medium">✓ Deposit returned</p>
            )}
          </div>
        </div>

        {/* Trip dates */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-navy-900">Trip Details</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Pickup:</span>{" "}
              <span className="font-medium">{booking.pickupLocation.name}</span>
            </p>
            <p className="text-gray-600 text-xs ml-0">
              {formatDateTime(booking.pickupDateTime)}
            </p>
            <p className="mt-2">
              <span className="text-gray-500">Drop-off:</span>{" "}
              <span className="font-medium">{booking.dropoffLocation.name}</span>
            </p>
            <p className="text-gray-600 text-xs">
              {formatDateTime(booking.dropoffDateTime)}
            </p>
            <p className="mt-2">
              <span className="text-gray-500">Duration:</span>{" "}
              <span className="font-semibold">
                {booking.durationDays} day{booking.durationDays !== 1 ? "s" : ""}
              </span>
            </p>
            {booking.pickedUpAt && (
              <p className="text-xs text-gray-500">
                Actual pickup: {formatDateTime(booking.pickedUpAt)}
              </p>
            )}
            {booking.returnedAt && (
              <p className="text-xs text-gray-500">
                Actual return: {formatDateTime(booking.returnedAt)}
              </p>
            )}
            {booking.actualReturnMileage && (
              <p className="text-xs text-gray-500">
                Return mileage: {booking.actualReturnMileage.toLocaleString()} km
              </p>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-navy-900">Pricing</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">
                {formatCurrency(booking.basePricePerDay)}/day × {booking.durationDays}d
              </span>
              <span>{formatCurrency(booking.subtotal)}</span>
            </div>
            {booking.extrasTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Extras</span>
                <span>{formatCurrency(booking.extrasTotal)}</span>
              </div>
            )}
            {booking.pickupFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Pickup fee</span>
                <span>{formatCurrency(booking.pickupFee)}</span>
              </div>
            )}
            {booking.dropoffFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Drop-off fee</span>
                <span>{formatCurrency(booking.dropoffFee)}</span>
              </div>
            )}
            {booking.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount{booking.couponCode ? ` (${booking.couponCode})` : ""}</span>
                <span>-{formatCurrency(booking.discount)}</span>
              </div>
            )}
            {(booking as { vatAmount?: number }).vatAmount != null && (booking as { vatAmount?: number }).vatAmount! > 0 && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal (excl. VAT)</span>
                  <span>{formatCurrency(booking.totalAmount - ((booking as { vatAmount?: number }).vatAmount ?? 0))}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>VAT ({Math.round(((booking as { vatRate?: number }).vatRate ?? 0) * 100)}%)</span>
                  <span>{formatCurrency((booking as { vatAmount?: number }).vatAmount ?? 0)}</span>
                </div>
              </>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-navy-900">
              <span>Total (incl. VAT)</span>
              <span>{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Deposit</span>
              <span>{formatCurrency(booking.depositAmount)}</span>
            </div>
            {booking.paymentMethod && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Payment method</span>
                <span className="capitalize">{booking.paymentMethod.replace("_", " ")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extras */}
      {booking.extras.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-navy-900 mb-3">Booked Extras</h2>
          <div className="space-y-2">
            {booking.extras.map((be) => (
              <div key={be.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{be.name}</span>
                <span className="font-medium">{formatCurrency(be.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment activity */}
      {paymentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-navy-900">Payment Activity</h2>
          </div>
          <div className="space-y-3">
            {paymentActivity.map((entry) => {
              const details = (entry.details ?? {}) as Record<string, unknown>;
              const amount = typeof details.amount === "number" ? details.amount : typeof details.amountRefunded === "number" ? details.amountRefunded : null;
              const isError = entry.action === "PAYMENT_FAILED";
              const isRefund = entry.action === "PAYMENT_REFUNDED" || entry.action === "PAYMENT_PARTIALLY_REFUNDED";
              const isPayment = entry.action === "PAYMENT_RECEIVED";
              const badge = isError
                ? "bg-red-50 text-red-700 border-red-200"
                : isRefund
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : isPayment
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-50 text-gray-700 border-gray-200";
              return (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${isError ? "bg-red-500" : isRefund ? "bg-amber-500" : "bg-green-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-xs border rounded-full px-2 py-0.5 font-medium ${badge}`}>
                        {entry.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                      {amount != null && <p>Amount: {formatCurrency(amount)}</p>}
                      {typeof details.stripePaymentIntentId === "string" && (
                        <p className="truncate font-mono">Intent: {details.stripePaymentIntentId}</p>
                      )}
                      {typeof details.lastError === "string" && (
                        <p className="text-red-700">Error: {details.lastError}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {booking.stripePaymentIntentId && (
            <p className="mt-4 text-xs text-gray-400 font-mono truncate">
              Stripe PaymentIntent: {booking.stripePaymentIntentId}
            </p>
          )}
        </div>
      )}

      {/* Status history */}
      {booking.statusHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-navy-900">Status History</h2>
          </div>
          <div className="space-y-3">
            {booking.statusHistory.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-2 w-2 bg-navy-700 rounded-full mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`status-badge text-xs ${getStatusColor(h.toStatus)}`}>
                      {h.toStatus}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(h.createdAt)}
                    </span>
                  </div>
                  {h.reason && (
                    <p className="text-xs text-gray-500 mt-1">{h.reason}</p>
                  )}
                  {h.changedBy && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      By: {h.changedBy.firstName} {h.changedBy.lastName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes editor */}
      <BookingNotesEditor
        bookingId={booking.id}
        internalNotes={booking.internalNotes}
        adminNotes={booking.adminNotes}
      />
    </div>
  );
}
