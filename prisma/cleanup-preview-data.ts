// Removes preview-polluting operational data without touching real admin accounts,
// fleet, locations, pricing rules, or site content. Dry-run by default.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");
const impossibleFutureDate = new Date("2030-01-01T00:00:00.000Z");
const maxPreviewBookingDays = 120;
const absurdPreviewTotal = 50_000;

async function main() {
  const impossibleBookings = await prisma.booking.findMany({
    where: {
      OR: [
        { durationDays: { gt: maxPreviewBookingDays } },
        { totalAmount: { gt: absurdPreviewTotal } },
        { dropoffDateTime: { gt: impossibleFutureDate } },
      ],
    },
    select: {
      id: true,
      bookingRef: true,
      durationDays: true,
      totalAmount: true,
      dropoffDateTime: true,
    },
  });

  const staleOperationalNoise = await prisma.booking.findMany({
    where: {
      status: "CANCELLED",
      paymentStatus: "UNPAID",
      cancellationReason: { contains: "Abandoned checkout" },
    },
    select: { id: true, bookingRef: true, createdAt: true },
  });

  const bookingIds = [
    ...new Set([
      ...impossibleBookings.map((booking) => booking.id),
      ...staleOperationalNoise.map((booking) => booking.id),
    ]),
  ];

  console.log(`Preview cleanup ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`Impossible/polluting bookings: ${impossibleBookings.length}`);
  for (const booking of impossibleBookings) {
    console.log(
      `- ${booking.bookingRef}: ${booking.durationDays} days, total ${booking.totalAmount}, dropoff ${booking.dropoffDateTime.toISOString()}`
    );
  }
  console.log(`Abandoned checkout noise: ${staleOperationalNoise.length}`);

  if (!APPLY || bookingIds.length === 0) return;

  await prisma.$transaction([
    prisma.bookingExtra.deleteMany({ where: { bookingId: { in: bookingIds } } }),
    prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookingIds } } }),
    prisma.activityLog.deleteMany({
      where: {
        OR: [
          { entity: "Booking", entityId: { in: bookingIds } },
          { action: "BOOKING_AUTO_CANCELLED" },
        ],
      },
    }),
    prisma.booking.deleteMany({ where: { id: { in: bookingIds } } }),
  ]);

  console.log(`Deleted ${bookingIds.length} preview booking(s) and related operational noise.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
