// src/app/(public)/booking/confirm/page.tsx
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle, Calendar, MapPin, Car, Mail, Phone, ArrowRight } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { getPublicSettings } from "@/lib/settings";

interface Props {
  searchParams: Promise<{ ref?: string }>;
}

export default async function BookingConfirmPage({ searchParams }: Props) {
  const sp = await searchParams;
  if (!sp.ref) notFound();

  const booking = await prisma.booking.findUnique({
    where: { bookingRef: sp.ref },
    include: {
      car: { include: { images: { where: { isPrimary: true } }, category: true } },
      pickupLocation: true,
      dropoffLocation: true,
      extras: true,
    },
  });

  if (!booking) notFound();

  const settings = await getPublicSettings();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="page-container max-w-2xl mx-auto">
        {/* Success header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mb-6">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-4">Your reservation has been received. A confirmation has been sent to your email.</p>
          <div className="inline-flex items-center gap-2 bg-navy-900 text-white rounded-xl px-5 py-2.5">
            <span className="text-sm font-medium">Booking Reference:</span>
            <span className="font-mono font-bold text-lg tracking-wider">{booking.bookingRef}</span>
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-navy-900 mb-4">Booking Details</h2>

          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="h-10 w-10 bg-navy-50 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-navy-700" />
            </div>
            <div>
              <p className="font-semibold text-navy-900">{booking.car.name}</p>
              <p className="text-sm text-gray-500">{booking.car.year} · {booking.car.category.name}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Pickup</p>
                <p className="text-sm font-medium text-navy-900">{booking.pickupLocation.name}</p>
                <p className="text-xs text-gray-500">{formatDateTime(booking.pickupDateTime)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Drop-off</p>
                <p className="text-sm font-medium text-navy-900">{booking.dropoffLocation.name}</p>
                <p className="text-xs text-gray-500">{formatDateTime(booking.dropoffDateTime)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{booking.durationDays} day{booking.durationDays !== 1 ? "s" : ""} × {formatCurrency(booking.basePricePerDay)}/day</span>
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
            {booking.vatAmount > 0 && (
              <>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-gray-500">
                  <span>Subtotal (excl. VAT)</span>
                  <span>{formatCurrency(booking.totalAmount - booking.vatAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>VAT ({Math.round(booking.vatRate * 100)}%)</span>
                  <span>{formatCurrency(booking.vatAmount)}</span>
                </div>
              </>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-navy-900">
              <span>Total (incl. VAT)</span>
              <span className="text-crimson-600">{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Security deposit (pre-authorised at pickup)</span>
              <span>{formatCurrency(booking.depositAmount)}</span>
            </div>
          </div>
        </div>

        {/* What to bring */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-navy-900 mb-3">What to Bring</h2>
          <ul className="space-y-2">
            {["Valid passport or national ID card", "Original driving licence", "Credit or debit card (for deposit)", "This booking confirmation (email or screenshot)"].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="bg-navy-900 rounded-2xl p-6 text-white mb-6">
          <h2 className="font-bold mb-3">Need Help?</h2>
          <p className="text-gray-300 text-sm mb-4">Our team is available 24/7. Don't hesitate to reach out.</p>
          <div className="flex flex-wrap gap-4">
            <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 text-sm hover:text-crimson-300 transition-colors">
              <Phone className="h-4 w-4" />
              {settings.phone}
            </a>
            <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2 text-sm hover:text-crimson-300 transition-colors">
              <Mail className="h-4 w-4" />
              {settings.supportEmail}
            </a>
            {settings.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-crimson-300 transition-colors"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/" className="btn-outline text-sm px-6 py-2.5">Back to Homepage</Link>
          <Link href="/fleet" className="btn-primary text-sm px-6 py-2.5">Browse More Cars <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}
