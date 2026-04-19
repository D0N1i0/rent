// src/app/(customer)/dashboard/bookings/[id]/page.tsx
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { differenceInHours } from "date-fns";
import { getPublicSettings } from "@/lib/settings";
import { BookingDetailClient } from "@/components/dashboard/booking-detail-client";

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
  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status) && hoursUntilPickup > 0;

  const bookingData = {
    id: booking.id,
    bookingRef: booking.bookingRef,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    pickupDateTime: booking.pickupDateTime,
    dropoffDateTime: booking.dropoffDateTime,
    durationDays: booking.durationDays,
    pricingTier: booking.pricingTier,
    basePricePerDay: booking.basePricePerDay,
    subtotal: booking.subtotal,
    extrasTotal: booking.extrasTotal,
    pickupFee: booking.pickupFee,
    dropoffFee: booking.dropoffFee,
    discount: booking.discount,
    couponCode: booking.couponCode,
    totalAmount: booking.totalAmount,
    depositAmount: booking.depositAmount,
    vatAmount: (booking as { vatAmount?: number | null }).vatAmount,
    vatRate: (booking as { vatRate?: number | null }).vatRate,
    specialRequests: booking.specialRequests,
    car: {
      name: booking.car.name,
      year: booking.car.year,
      images: booking.car.images.map((img) => ({ url: img.url })),
      category: { name: booking.car.category.name },
    },
    pickupLocation: { name: booking.pickupLocation.name },
    dropoffLocation: { name: booking.dropoffLocation.name },
    extras: booking.extras.map((e) => ({ id: e.id, name: e.name, total: e.total })),
    statusHistory: booking.statusHistory.map((h) => ({
      toStatus: h.toStatus,
      reason: h.reason,
      createdAt: h.createdAt,
    })),
  };

  return (
    <BookingDetailClient
      booking={bookingData}
      hoursUntilPickup={hoursUntilPickup}
      canCancel={canCancel}
      settings={{ phone: settings.phone, email: settings.supportEmail }}
      documentLicenseUrl={bookingDocs?.documentLicenseUrl}
      documentIdUrl={bookingDocs?.documentIdUrl}
    />
  );
}
