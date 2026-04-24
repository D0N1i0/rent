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
    include: {
      car: { include: { images: { where: { isPrimary: true } }, category: true } },
      pickupLocation: { select: { name: true } },
      dropoffLocation: { select: { name: true } },
      extras: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <BookingsListClient bookings={bookings as unknown as { id: string; bookingRef: string; status: string; paymentStatus: string; totalAmount: number; durationDays: number; pickupDateTime: Date; dropoffDateTime: Date; car: { name: string }; pickupLocation: { name: string } }[]} />;
}
