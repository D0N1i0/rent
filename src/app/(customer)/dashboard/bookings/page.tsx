// src/app/(customer)/dashboard/bookings/page.tsx
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingsListClient } from "@/components/dashboard/bookings-list-client";

export default async function CustomerBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/bookings");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      bookingRef: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      durationDays: true,
      pickupDateTime: true,
      dropoffDateTime: true,
      car: { select: { name: true, brand: true, model: true, images: { where: { isPrimary: true }, select: { url: true, alt: true } } } },
      pickupLocation: { select: { name: true } },
      dropoffLocation: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return <BookingsListClient bookings={bookings as unknown as { id: string; bookingRef: string; status: string; paymentStatus: string; totalAmount: number; durationDays: number; pickupDateTime: Date; dropoffDateTime: Date; car: { name: string }; pickupLocation: { name: string } }[]} />;
}
