// src/app/(customer)/dashboard/bookings/[id]/page.tsx
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { differenceInHours } from "date-fns";
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
  getPaymentStatusColor,
} from "@/lib/utils";
import { Car, MapPin, Calendar, ChevronLeft, Phone, Mail, CheckCircle, Clock, FileText, Upload } from "lucide-react";
import { CancelBookingButton } from "@/components/booking/cancel-booking-button";
import { DocumentUpload } from "@/components/booking/document-upload";
import { getPublicSettings } from "@/lib/settings";

export default async function CustomerBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const booking = await prisma.booking.findFirst({
    where: { id, userId: session.user.id },
    include: {
      car: { include: { images: { where: { isPrimary: true } }, category: true } },
      pickupLocation: true,
      dropoffLocation: true,
      extras: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { toStatus: true, reason: true, createdAt: true },
      },
    },
  });

  // Fetch document URLs separately to avoid TS type issues after schema migration
  const bookingDocs = booking
    ? await prisma.booking.findUnique({
        where: { id },
        select: { documentLicenseUrl: true, documentIdUrl: true },
      })
    : null;

  if (!booking) notFound();

  const settings = await getPublicSettings();
  const hoursUntilPickup = differenceInHours(booking.pickupDateTime, new Date());
  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);

  return (
    <div>
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 mb-3 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to bookings
          </Link>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Booking {booking.bookingRef}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`status-badge ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
            <span className={`status-badge ${getPaymentStatusColor(booking.paymentStatus)}`}>
              {booking.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="page-container py-8 max-w-3xl mx-auto space-y-5">
        {/* Car */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <Car className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-navy-900">Vehicle</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-20 w-28 bg-gray-100 rounded-xl overflow-hidden shrink-0">
              {booking.car.images[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={booking.car.images[0].url}
                  alt={booking.car.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Car className="h-8 w-8 text-gray-300" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-crimson-500 font-semibold">{booking.car.category.name}</p>
              <p className="font-bold text-navy-900 text-lg">{booking.car.name}</p>
              <p className="text-sm text-gray-500">{booking.car.year}</p>
            </div>
          </div>
        </div>

        {/* Trip details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-navy-900">Trip Details</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3 bg-green-50 rounded-xl p-3">
              <MapPin className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-navy-900">Pickup</p>
                <p className="text-gray-600">{booking.pickupLocation.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {formatDateTime(booking.pickupDateTime)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-3">
              <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-navy-900">Drop-off</p>
                <p className="text-gray-600">{booking.dropoffLocation.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {formatDateTime(booking.dropoffDateTime)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-navy-50 rounded-xl p-3 text-sm text-center">
            <span className="font-bold text-navy-900">{booking.durationDays} day{booking.durationDays !== 1 ? "s" : ""}</span>
            <span className="text-gray-600"> total rental</span>
            {booking.pricingTier !== "daily" && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                {booking.pricingTier} rate applied
              </span>
            )}
          </div>
        </div>

        {/* Extras */}
        {booking.extras.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-navy-900 mb-3">Extras & Services</h2>
            <div className="space-y-2">
              {booking.extras.map((be) => (
                <div key={be.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">{be.name}</span>
                  </div>
                  <span className="font-medium text-navy-900">{formatCurrency(be.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-navy-900 mb-4">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>
                {formatCurrency(booking.basePricePerDay)}/day × {booking.durationDays} days
              </span>
              <span>{formatCurrency(booking.subtotal)}</span>
            </div>
            {booking.extrasTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Extras</span>
                <span>{formatCurrency(booking.extrasTotal)}</span>
              </div>
            )}
            {booking.pickupFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Pickup fee</span>
                <span>{formatCurrency(booking.pickupFee)}</span>
              </div>
            )}
            {booking.dropoffFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Drop-off fee</span>
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
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Subtotal (excl. VAT)</span>
                  <span>{formatCurrency(booking.totalAmount - ((booking as { vatAmount?: number }).vatAmount ?? 0))}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>VAT ({Math.round(((booking as { vatRate?: number }).vatRate ?? 0) * 100)}%)</span>
                  <span>{formatCurrency((booking as { vatAmount?: number }).vatAmount ?? 0)}</span>
                </div>
              </>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-navy-900 text-base">
              <span>Total (incl. VAT)</span>
              <span className="text-crimson-600">{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Security deposit (pre-auth at pickup)</span>
              <span>{formatCurrency(booking.depositAmount)}</span>
            </div>
          </div>
        </div>

        {/* Status history */}
        {booking.statusHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-gray-400" />
              <h2 className="font-bold text-navy-900">Booking Timeline</h2>
            </div>
            <div className="space-y-3">
              {booking.statusHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-navy-700 rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-navy-900 capitalize">
                      {h.toStatus.replace("_", " ")}
                    </p>
                    {h.reason && (
                      <p className="text-xs text-gray-500">{h.reason}</p>
                    )}
                    <p className="text-xs text-gray-400">{formatDateTime(h.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special requests */}
        {booking.specialRequests && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-navy-900 mb-2">Your Special Requests</h2>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {booking.specialRequests}
            </p>
          </div>
        )}

        {/* Cancellation */}
        {canCancel && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-navy-900 mb-2">Cancellation</h2>
            <p className="text-sm text-gray-600 mb-3">
              {hoursUntilPickup >= 48
                ? "Free cancellation available — more than 48 hours before pickup."
                : "Note: Late cancellations within 48 hours of pickup may incur a fee."}
            </p>
            <CancelBookingButton
              bookingId={booking.id}
              bookingRef={booking.bookingRef}
              hoursUntilPickup={hoursUntilPickup}
            />
          </div>
        )}

        {/* Document Upload */}
        {["PENDING", "CONFIRMED"].includes(booking.status) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-gray-400" />
              <h2 className="font-bold text-navy-900">Upload Documents</h2>
            </div>
            <DocumentUpload
              bookingId={booking.id}
              existingLicenseUrl={bookingDocs?.documentLicenseUrl}
              existingIdUrl={bookingDocs?.documentIdUrl}
            />
          </div>
        )}

        {/* Invoice download */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              <h2 className="font-bold text-navy-900">Invoice / Receipt</h2>
            </div>
            <a
              href={`/api/bookings/${booking.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <FileText className="h-4 w-4" />
              Download Invoice
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-2">Opens as a printable page. Use Ctrl+P or browser print to save as PDF.</p>
        </div>

        {/* Contact */}
        <div className="bg-navy-900 rounded-2xl p-5 text-white">
          <h2 className="font-bold mb-2">Need Help?</h2>
          <p className="text-gray-300 text-sm mb-3">
            Quote reference{" "}
            <span className="font-mono font-bold text-crimson-400">{booking.bookingRef}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`tel:${settings.phone.replace(/\s+/g, "")}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Phone className="h-4 w-4" /> +383 44 123 456
            </a>
            <a
              href="mailto:info@autokos.com"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Mail className="h-4 w-4" /> info@autokos.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
