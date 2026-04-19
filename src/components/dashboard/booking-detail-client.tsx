"use client";
// src/components/dashboard/booking-detail-client.tsx
// Client component for the customer booking detail page — handles i18n translations.

import { useState } from "react";
import Link from "next/link";
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
  getPaymentStatusColor,
} from "@/lib/utils";
import {
  Car,
  MapPin,
  Calendar,
  ChevronLeft,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  FileText,
  Upload,
  CreditCard,
  Loader2,
} from "lucide-react";
import { CancelBookingButton } from "@/components/booking/cancel-booking-button";
import { DocumentUpload } from "@/components/booking/document-upload";
import { StripePaymentForm } from "@/components/booking/stripe-payment-form";
import { useLanguage, useT } from "@/lib/i18n/context";

interface BookingDetailClientProps {
  booking: {
    id: string;
    bookingRef: string;
    status: string;
    paymentStatus: string;
    pickupDateTime: Date;
    dropoffDateTime: Date;
    durationDays: number;
    pricingTier: string;
    basePricePerDay: number;
    subtotal: number;
    extrasTotal: number;
    pickupFee: number;
    dropoffFee: number;
    discount: number;
    couponCode: string | null;
    totalAmount: number;
    depositAmount: number;
    vatAmount?: number | null;
    vatRate?: number | null;
    specialRequests: string | null;
    car: {
      name: string;
      year: number;
      images: { url: string }[];
      category: { name: string };
    };
    pickupLocation: { name: string };
    dropoffLocation: { name: string };
    extras: { id: string; name: string; total: number }[];
    statusHistory: { toStatus: string; reason: string | null; createdAt: Date }[];
  };
  hoursUntilPickup: number;
  canCancel: boolean;
  settings: { phone: string; email: string };
  documentLicenseUrl?: string | null;
  documentIdUrl?: string | null;
}

export function BookingDetailClient({
  booking,
  hoursUntilPickup,
  canCancel,
  settings,
  documentLicenseUrl,
  documentIdUrl,
}: BookingDetailClientProps) {
  const { locale } = useLanguage();
  const t = useT();
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);

  const stripeEnabled = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const canPayOnline =
    stripeEnabled &&
    ["PENDING", "CONFIRMED"].includes(booking.status) &&
    booking.paymentStatus === "UNPAID";

  async function handlePayOnline() {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        setPaymentError(data.error ?? "Failed to start payment. Please try again.");
        return;
      }
      setPaymentClientSecret(data.clientSecret);
    } catch {
      setPaymentError("Failed to start payment. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  }

  const label = {
    backToBookings: locale === "al" ? "Kthehu te rezervimet" : "Back to bookings",
    vehicle: locale === "al" ? "Automjeti" : "Vehicle",
    tripDetails: locale === "al" ? "Detajet e Udhëtimit" : "Trip Details",
    pickup: locale === "al" ? "Marrja" : "Pickup",
    dropoff: locale === "al" ? "Kthimi" : "Drop-off",
    day: locale === "al" ? "ditë" : "day",
    days: locale === "al" ? "ditë" : "days",
    totalRental: locale === "al" ? "qira gjithsej" : "total rental",
    rateApplied: locale === "al" ? "tarifë e aplikuar" : "rate applied",
    extrasServices: locale === "al" ? "Shtesat & Shërbimet" : "Extras & Services",
    paymentSummary: locale === "al" ? "Përmbledhja e Pagesës" : "Payment Summary",
    extras: locale === "al" ? "Shtesat" : "Extras",
    pickupFee: locale === "al" ? "Tarifa e marrjes" : "Pickup fee",
    dropoffFee: locale === "al" ? "Tarifa e kthimit" : "Drop-off fee",
    discount: locale === "al" ? "Zbritje" : "Discount",
    subtotalExclVat: locale === "al" ? "Nëntotali (pa TVSH)" : "Subtotal (excl. VAT)",
    totalInclVat: locale === "al" ? "Totali (me TVSH)" : "Total (incl. VAT)",
    securityDeposit:
      locale === "al"
        ? "Depozita e sigurisë (para-autorizim në marrje)"
        : "Security deposit (pre-auth at pickup)",
    bookingTimeline: locale === "al" ? "Kronologjia e Rezervimit" : "Booking Timeline",
    specialRequests: locale === "al" ? "Kërkesat Tuaja Speciale" : "Your Special Requests",
    cancellation: locale === "al" ? "Anulimi" : "Cancellation",
    freeCancellation:
      locale === "al"
        ? "Anulim falas i disponueshëm — më shumë se 48 orë para marrjes."
        : "Free cancellation available — more than 48 hours before pickup.",
    lateCancellation:
      locale === "al"
        ? "Shënim: Anulimet e vonuara brenda 48 orëve mund të aplikohen tarifa."
        : "Note: Late cancellations within 48 hours of pickup may incur a fee.",
    uploadDocuments: locale === "al" ? "Ngarko Dokumentet" : "Upload Documents",
    invoiceReceipt: locale === "al" ? "Faturë / Kupon" : "Invoice / Receipt",
    downloadInvoice: locale === "al" ? "Shkarko Faturën" : "Download Invoice",
    printNote:
      locale === "al"
        ? "Hapet si faqe e printueshme. Përdor Ctrl+P ose printimin e shfletuesit për ta ruajtur si PDF."
        : "Opens as a printable page. Use Ctrl+P or browser print to save as PDF.",
    needHelp: locale === "al" ? "Keni Nevojë për Ndihmë?" : "Need Help?",
    quoteReference: locale === "al" ? "Citoni referencën" : "Quote reference",
  };

  return (
    <div>
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 mb-3 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> {label.backToBookings}
          </Link>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Booking {booking.bookingRef}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`status-badge ${getStatusColor(booking.status)}`}>
              {t.dashboard.status[booking.status as keyof typeof t.dashboard.status] ??
                booking.status}
            </span>
            <span className={`status-badge ${getPaymentStatusColor(booking.paymentStatus)}`}>
              {t.dashboard.payment[booking.paymentStatus as keyof typeof t.dashboard.payment] ??
                booking.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="page-container py-8 max-w-3xl mx-auto space-y-5">
        {/* Car */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <Car className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-navy-900">{label.vehicle}</h2>
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
            <h2 className="font-bold text-navy-900">{label.tripDetails}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3 bg-green-50 rounded-xl p-3">
              <MapPin className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-navy-900">{label.pickup}</p>
                <p className="text-gray-600">{booking.pickupLocation.name}</p>
                <p className="text-gray-500 text-xs mt-0.5" suppressHydrationWarning>
                  {formatDateTime(booking.pickupDateTime)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-3">
              <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-navy-900">{label.dropoff}</p>
                <p className="text-gray-600">{booking.dropoffLocation.name}</p>
                <p className="text-gray-500 text-xs mt-0.5" suppressHydrationWarning>
                  {formatDateTime(booking.dropoffDateTime)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-navy-50 rounded-xl p-3 text-sm text-center">
            <span className="font-bold text-navy-900">
              {booking.durationDays} {booking.durationDays !== 1 ? label.days : label.day}
            </span>
            <span className="text-gray-600"> {label.totalRental}</span>
            {booking.pricingTier !== "daily" && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                {booking.pricingTier} {label.rateApplied}
              </span>
            )}
          </div>
        </div>

        {/* Extras */}
        {booking.extras.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-navy-900 mb-3">{label.extrasServices}</h2>
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
          <h2 className="font-bold text-navy-900 mb-4">{label.paymentSummary}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>
                {formatCurrency(booking.basePricePerDay)}/{label.day} × {booking.durationDays}{" "}
                {label.days}
              </span>
              <span>{formatCurrency(booking.subtotal)}</span>
            </div>
            {booking.extrasTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{label.extras}</span>
                <span>{formatCurrency(booking.extrasTotal)}</span>
              </div>
            )}
            {booking.pickupFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{label.pickupFee}</span>
                <span>{formatCurrency(booking.pickupFee)}</span>
              </div>
            )}
            {booking.dropoffFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{label.dropoffFee}</span>
                <span>{formatCurrency(booking.dropoffFee)}</span>
              </div>
            )}
            {booking.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  {label.discount}
                  {booking.couponCode ? ` (${booking.couponCode})` : ""}
                </span>
                <span>-{formatCurrency(booking.discount)}</span>
              </div>
            )}
            {booking.vatAmount != null && booking.vatAmount > 0 && (
              <>
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>{label.subtotalExclVat}</span>
                  <span>{formatCurrency(booking.totalAmount - (booking.vatAmount ?? 0))}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>VAT ({Math.round(((booking.vatRate ?? 0) * 100))}%)</span>
                  <span>{formatCurrency(booking.vatAmount ?? 0)}</span>
                </div>
              </>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-navy-900 text-base">
              <span>{label.totalInclVat}</span>
              <span className="text-crimson-600">{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>{label.securityDeposit}</span>
              <span>{formatCurrency(booking.depositAmount)}</span>
            </div>
          </div>
        </div>

        {/* Pay Online — shown when booking is unpaid and Stripe is configured */}
        {canPayOnline && !paymentDone && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-crimson-500" />
              <h2 className="font-bold text-navy-900">
                {locale === "al" ? "Paguaj Online" : "Pay Online"}
              </h2>
            </div>
            {!paymentClientSecret ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  {locale === "al"
                    ? "Paguaj tani me kartë debit ose kredit. Pagesa është e sigurt dhe procesohet nga Stripe."
                    : "Pay now by debit or credit card. Payment is secure and processed by Stripe."}
                </p>
                {paymentError && (
                  <p className="text-sm text-red-600 mb-3">{paymentError}</p>
                )}
                <button
                  onClick={handlePayOnline}
                  disabled={paymentLoading}
                  className="flex items-center gap-2 bg-crimson-600 hover:bg-crimson-700 disabled:bg-gray-400 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  {paymentLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {locale === "al" ? "Duke ngarkuar..." : "Loading..."}</>
                  ) : (
                    <><CreditCard className="h-4 w-4" /> {locale === "al" ? "Paguaj Tani" : "Pay Now"} — {formatCurrency(booking.totalAmount)}</>
                  )}
                </button>
              </>
            ) : (
              <StripePaymentForm
                clientSecret={paymentClientSecret}
                bookingRef={booking.bookingRef}
                totalAmount={booking.totalAmount}
                onSuccess={() => {
                  setPaymentDone(true);
                  // Reload to reflect confirmed status from webhook
                  setTimeout(() => window.location.reload(), 2000);
                }}
                onCancel={() => {
                  setPaymentClientSecret(null);
                  setPaymentError(null);
                }}
              />
            )}
          </div>
        )}

        {paymentDone && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-green-800">
              {locale === "al" ? "Pagesa u krye me sukses!" : "Payment successful!"}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {locale === "al"
                ? "Rezervimi juaj është konfirmuar. Duke rifreskuar..."
                : "Your booking is confirmed. Refreshing..."}
            </p>
          </div>
        )}

        {/* Status history */}
        {booking.statusHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-gray-400" />
              <h2 className="font-bold text-navy-900">{label.bookingTimeline}</h2>
            </div>
            <div className="space-y-3">
              {booking.statusHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-navy-700 rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-navy-900 capitalize">
                      {h.toStatus.replace("_", " ")}
                    </p>
                    {h.reason && <p className="text-xs text-gray-500">{h.reason}</p>}
                    <p className="text-xs text-gray-400" suppressHydrationWarning>{formatDateTime(h.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special requests */}
        {booking.specialRequests && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-navy-900 mb-2">{label.specialRequests}</h2>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {booking.specialRequests}
            </p>
          </div>
        )}

        {/* Cancellation */}
        {canCancel && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-navy-900 mb-2">{label.cancellation}</h2>
            <p className="text-sm text-gray-600 mb-3">
              {hoursUntilPickup >= 48 ? label.freeCancellation : label.lateCancellation}
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
              <h2 className="font-bold text-navy-900">{label.uploadDocuments}</h2>
            </div>
            <DocumentUpload
              bookingId={booking.id}
              existingLicenseUrl={documentLicenseUrl}
              existingIdUrl={documentIdUrl}
            />
          </div>
        )}

        {/* Invoice download */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              <h2 className="font-bold text-navy-900">{label.invoiceReceipt}</h2>
            </div>
            <a
              href={`/api/bookings/${booking.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <FileText className="h-4 w-4" />
              {label.downloadInvoice}
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-2">{label.printNote}</p>
        </div>

        {/* Contact */}
        <div className="bg-navy-900 rounded-2xl p-5 text-white">
          <h2 className="font-bold mb-2">{label.needHelp}</h2>
          <p className="text-gray-300 text-sm mb-3">
            {label.quoteReference}{" "}
            <span className="font-mono font-bold text-crimson-400">{booking.bookingRef}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`tel:${settings.phone.replace(/\s+/g, "")}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Phone className="h-4 w-4" /> {settings.phone}
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Mail className="h-4 w-4" /> {settings.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
