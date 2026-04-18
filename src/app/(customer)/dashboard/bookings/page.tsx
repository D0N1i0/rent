// src/app/(customer)/dashboard/bookings/page.tsx
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingsListClient } from "@/components/dashboard/bookings-list-client";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function CustomerBookingsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/bookings");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const uid = session.user.id;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: uid },
      select: {
        id: true, bookingRef: true, status: true, paymentStatus: true,
        pickupDateTime: true, dropoffDateTime: true, durationDays: true,
        totalAmount: true, depositAmount: true, couponCode: true,
        specialRequests: true, createdAt: true, cancelledAt: true,
        car: {
          select: {
            id: true, name: true, brand: true, slug: true,
            images: { where: { isPrimary: true }, select: { url: true, alt: true } },
            category: { select: { name: true } },
          },
        },
        pickupLocation: { select: { name: true } },
        dropoffLocation: { select: { name: true } },
        extras: {
          select: { id: true, name: true, price: true, pricingType: true, total: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where: { userId: uid } }),
  ]);

  return <BookingsListClient bookings={bookings} total={total} page={page} pageSize={PAGE_SIZE} />;
}
