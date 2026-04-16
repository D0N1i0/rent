// src/app/api/bookings/[id]/invoice/route.ts
// Returns an HTML invoice for a booking — printable as PDF.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/authz";
import { generateInvoiceHTML } from "@/lib/pdf-invoice";
import { getPublicSettings } from "@/lib/settings";

// Allow admins to get any booking invoice; customers only their own
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      car: { select: { name: true, year: true } },
      pickupLocation: { select: { name: true } },
      dropoffLocation: { select: { name: true } },
      extras: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Authorization: admin sees all, customer sees own
  const isAdmin = isAdminRole(session.user.role as "ADMIN" | "STAFF" | "CUSTOMER");
  if (!isAdmin && booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const settings = await getPublicSettings();

  const html = generateInvoiceHTML({
    bookingRef: booking.bookingRef,
    invoiceDate: booking.createdAt,
    businessName: settings.businessName || "AutoKos",
    businessAddress: settings.address || "Pristina, Kosovo",
    businessPhone: settings.phone || "",
    businessEmail: settings.supportEmail || "",
    businessVatId: undefined,
    customerName: `${booking.guestFirstName ?? ""} ${booking.guestLastName ?? ""}`.trim(),
    customerEmail: booking.guestEmail ?? "",
    customerPhone: booking.guestPhone ?? undefined,
    carName: booking.car.name,
    carYear: booking.car.year,
    pickupLocation: booking.pickupLocation.name,
    dropoffLocation: booking.dropoffLocation.name,
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
    vatRate: booking.vatRate,
    vatAmount: booking.vatAmount,
    depositAmount: booking.depositAmount,
    totalAmount: booking.totalAmount,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    extras: booking.extras.map((e) => ({ name: e.name, total: e.total })),
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="invoice-${booking.bookingRef}.html"`,
    },
  });
}
