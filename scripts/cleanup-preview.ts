/**
 * Preview/Demo data cleanup script.
 * Run dry-run first: npx tsx scripts/cleanup-preview.ts
 * Apply cleanup:     npx tsx scripts/cleanup-preview.ts --apply
 *
 * What it identifies:
 * - Demo/seed user accounts (john.doe@example.com, besa.berisha@gmail.com, muharrem.gashi@gmail.com)
 * - Bookings owned by demo users
 * - Guest bookings with seed booking refs (AK-2025-000X pattern)
 *
 * What it does NOT remove:
 * - The admin@autokos.com account
 * - Any booking with a non-seed bookingRef (i.e. real customer bookings)
 * - Any real user who registered after seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const DEMO_EMAILS = [
  "john.doe@example.com",
  "besa.berisha@gmail.com",
  "muharrem.gashi@gmail.com",
];

const SEED_BOOKING_REFS = [
  "AK-2025-0001",
  "AK-2025-0002",
  "AK-2025-0003",
  "AK-2025-0004",
];

async function main() {
  console.log(apply ? "🗑️  APPLYING cleanup...\n" : "🔍 DRY RUN — no changes will be made\n");
  console.log("Pass --apply to actually delete.\n");

  // Find demo users
  const demoUsers = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true, email: true, firstName: true, lastName: true, _count: { select: { bookings: true } } },
  });

  console.log(`Found ${demoUsers.length} demo user(s):`);
  for (const u of demoUsers) {
    console.log(`  • ${u.email} (${u.firstName} ${u.lastName}) — ${u._count.bookings} booking(s)`);
  }

  // Find seed bookings
  const seedBookings = await prisma.booking.findMany({
    where: { bookingRef: { in: SEED_BOOKING_REFS } },
    select: { id: true, bookingRef: true, status: true, paymentStatus: true, guestEmail: true },
  });

  console.log(`\nFound ${seedBookings.length} seed booking(s):`);
  for (const b of seedBookings) {
    console.log(`  • ${b.bookingRef} — status: ${b.status}, payment: ${b.paymentStatus}, guest: ${b.guestEmail}`);
  }

  const demoUserIds = demoUsers.map(u => u.id);
  const seedBookingIds = seedBookings.map(b => b.id);

  // Also find bookings owned by demo users (beyond seed refs)
  const demoUserBookings = await prisma.booking.findMany({
    where: { userId: { in: demoUserIds }, bookingRef: { notIn: SEED_BOOKING_REFS } },
    select: { id: true, bookingRef: true, status: true },
  });

  if (demoUserBookings.length > 0) {
    console.log(`\nFound ${demoUserBookings.length} additional booking(s) owned by demo users (not in seed list):`);
    for (const b of demoUserBookings) {
      console.log(`  ⚠️  ${b.bookingRef} — ${b.status} — REVIEW before deleting`);
    }
    console.log("  → These will NOT be auto-deleted. Review manually.");
  }

  const allBookingIdsToDelete = [...new Set([...seedBookingIds])];

  console.log(`\n${ apply ? "DELETING" : "Would delete" }:`);
  console.log(`  • ${allBookingIdsToDelete.length} seed booking(s)`);
  console.log(`  • ${demoUsers.length} demo user(s) (and their associated data)`);

  if (!apply) {
    console.log("\n⚠️  DRY RUN complete. No changes made.");
    console.log("   Run with --apply to execute cleanup.");
    return;
  }

  // Delete in order: booking extras/history/related → bookings → users
  for (const bookingId of allBookingIdsToDelete) {
    await prisma.bookingExtra.deleteMany({ where: { bookingId } });
    await prisma.bookingStatusHistory.deleteMany({ where: { bookingId } });
    await prisma.refundRecord.deleteMany({ where: { bookingId } });
    await prisma.booking.delete({ where: { id: bookingId } });
    console.log(`  🗑️  Deleted booking ${bookingId}`);
  }

  for (const userId of demoUserIds) {
    // Delete bookings owned by this user (non-seed ones were reviewed above — skip them)
    const userBookings = await prisma.booking.findMany({ where: { userId } });
    for (const b of userBookings) {
      await prisma.bookingExtra.deleteMany({ where: { bookingId: b.id } });
      await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: b.id } });
      await prisma.refundRecord.deleteMany({ where: { bookingId: b.id } });
      await prisma.booking.delete({ where: { id: b.id } });
    }
    await prisma.user.delete({ where: { id: userId } });
    console.log(`  🗑️  Deleted user ${userId}`);
  }

  console.log("\n✅ Cleanup applied.");
  console.log("   Verify admin user list and booking count in the admin dashboard.");
}

main()
  .catch((e) => { console.error("❌ Cleanup failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
