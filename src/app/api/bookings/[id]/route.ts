// src/app/api/bookings/[id]/route.ts
// Fetch a single booking by ID. Customers can only access their own bookings;
// admins/staff can access any booking.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/authz";

export async function GET(
  _req: NextRequest,
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
      car: {
        select: {
          name: true,
          brand: true,
          model: true,
          year: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
      pickupLocation: true,
      dropoffLocation: true,
      extras: { include: { extra: { select: { name: true, description: true, iconUrl: true } } } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { fromStatus: true, toStatus: true, reason: true, createdAt: true },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isAdmin = isAdminRole(session.user.role as string);

  // Customers can only see their own bookings; guest bookings (userId=null) can
  // only be viewed by admins.
  if (!isAdmin) {
    if (!booking.userId || booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  // Strip Stripe client secret from customer-facing response (admins need it for reconciliation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { stripeClientSecret, ...safeBooking } = booking as typeof booking & { stripeClientSecret?: string | null };

  return NextResponse.json({ booking: isAdmin ? booking : safeBooking });
}
