// src/app/api/admin/export/bookings/route.ts
// Export all bookings as CSV for accounting/reporting.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { format } from "date-fns";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function escapeCsv(val: unknown): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(fields: unknown[]): string {
  return fields.map(escapeCsv).join(",");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  // Customer data export is high-privilege — restrict to ADMIN only (not STAFF)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const validStatuses: BookingStatus[] = ["PENDING","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW","REJECTED"];

  const whereStatus = status && status !== "ALL" && (validStatuses as string[]).includes(status)
    ? { status: status as BookingStatus }
    : {};

  const whereDate = from || to
    ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
    : {};

  const where = { ...whereStatus, ...whereDate };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      car: { select: { name: true, brand: true, licensePlate: true } },
      pickupLocation: { select: { name: true } },
      dropoffLocation: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Booking Ref",
    "Created At",
    "Status",
    "Payment Status",
    "Payment Method",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Car",
    "License Plate",
    "Pickup Location",
    "Dropoff Location",
    "Pickup DateTime",
    "Return DateTime",
    "Duration (days)",
    "Pricing Tier",
    "Base Price/Day",
    "Subtotal",
    "Extras Total",
    "Pickup Fee",
    "Dropoff Fee",
    "Discount",
    "VAT Rate",
    "VAT Amount",
    "Total Amount",
    "Deposit Amount",
    "Coupon Code",
    "Special Requests",
  ];

  const lines: string[] = [row(headers)];

  for (const b of bookings) {
    lines.push(row([
      b.bookingRef,
      format(new Date(b.createdAt), "yyyy-MM-dd HH:mm"),
      b.status,
      b.paymentStatus,
      b.paymentMethod ?? "",
      `${b.guestFirstName ?? ""} ${b.guestLastName ?? ""}`.trim(),
      b.guestEmail ?? "",
      b.guestPhone ?? "",
      b.car.name,
      b.car.licensePlate ?? "",
      b.pickupLocation.name,
      b.dropoffLocation.name,
      format(new Date(b.pickupDateTime), "yyyy-MM-dd HH:mm"),
      format(new Date(b.dropoffDateTime), "yyyy-MM-dd HH:mm"),
      b.durationDays,
      b.pricingTier,
      b.basePricePerDay.toFixed(2),
      b.subtotal.toFixed(2),
      b.extrasTotal.toFixed(2),
      b.pickupFee.toFixed(2),
      b.dropoffFee.toFixed(2),
      b.discount.toFixed(2),
      `${Math.round(b.vatRate * 100)}%`,
      b.vatAmount.toFixed(2),
      b.totalAmount.toFixed(2),
      b.depositAmount.toFixed(2),
      b.couponCode ?? "",
      b.specialRequests ?? "",
    ]));
  }

  const csv = lines.join("\r\n");
  const filename = `autokos-bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
