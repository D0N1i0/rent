// prisma/cleanup-dev-data.ts
// ─────────────────────────────────────────────────────────────────────────────
// Safe cleanup script for preview / development data that pollutes the live DB.
//
// USAGE (dry run — shows what would be removed, changes nothing):
//   npx ts-node --project tsconfig.seed.json prisma/cleanup-dev-data.ts
//
// USAGE (apply — actually deletes/fixes records):
//   npx ts-node --project tsconfig.seed.json prisma/cleanup-dev-data.ts --apply
//
// WHAT IT CLEANS:
//   1. Bookings with suspiciously long duration (> 365 days) — these are test/dev
//      artifacts that inflate analytics and pollute the admin view.
//   2. Car images with broken/non-existent local paths (e.g. /images/cars/*.jpg)
//      — updates them to use the available /images/car-placeholder.svg instead.
//   3. Optionally removes developer/test accounts by email.
//      Edit DEV_EMAILS below to include any accounts you want removed.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes("--apply");

// ── Add any developer/test account emails here before running with --apply ──
// These accounts (and their bookings) will be deleted.
const DEV_EMAILS: string[] = [
  // "edon.hetemi@example.com",   // ← Uncomment and edit with real emails
  // "developer@yourdomain.com",
];

const PLACEHOLDER_URL = "/images/car-placeholder.svg";
const MAX_SANE_DURATION_DAYS = 365;

async function main() {
  console.log(`\n🧹 AutoKos Dev-Data Cleanup${DRY_RUN ? " (DRY RUN — no changes)" : " ⚠ APPLYING CHANGES"}\n`);

  // ── 1. Bookings with absurd durations ────────────────────────────────────
  const longBookings = await prisma.booking.findMany({
    where: { durationDays: { gt: MAX_SANE_DURATION_DAYS } },
    select: { id: true, bookingRef: true, durationDays: true, guestEmail: true, status: true },
    orderBy: { durationDays: "desc" },
  });

  console.log(`Found ${longBookings.length} booking(s) with duration > ${MAX_SANE_DURATION_DAYS} days:`);
  longBookings.forEach((b) => {
    console.log(`  ✗ ${b.bookingRef} — ${b.durationDays} days — ${b.guestEmail} — ${b.status}`);
  });

  if (longBookings.length > 0 && !DRY_RUN) {
    const ids = longBookings.map((b) => b.id);
    // Delete related records first (FK constraints)
    await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: ids } } });
    await prisma.bookingExtra.deleteMany({ where: { bookingId: { in: ids } } });
    await prisma.booking.deleteMany({ where: { id: { in: ids } } });
    console.log(`  ✅ Deleted ${ids.length} long booking(s)`);
  }

  // ── 2. Broken car image URLs ─────────────────────────────────────────────
  const brokenImages = await prisma.carImage.findMany({
    where: {
      url: { startsWith: "/images/cars/" },
    },
    select: { id: true, url: true, carId: true },
  });

  console.log(`\nFound ${brokenImages.length} car image record(s) with broken /images/cars/*.jpg URLs:`);
  brokenImages.slice(0, 10).forEach((img) => {
    console.log(`  ✗ ${img.url}`);
  });
  if (brokenImages.length > 10) {
    console.log(`  ... and ${brokenImages.length - 10} more`);
  }

  if (brokenImages.length > 0 && !DRY_RUN) {
    await prisma.carImage.updateMany({
      where: { url: { startsWith: "/images/cars/" } },
      data: { url: PLACEHOLDER_URL },
    });
    console.log(`  ✅ Updated ${brokenImages.length} broken image URL(s) → ${PLACEHOLDER_URL}`);
  }

  // ── 3. Developer / test accounts ─────────────────────────────────────────
  if (DEV_EMAILS.length > 0) {
    const devUsers = await prisma.user.findMany({
      where: { email: { in: DEV_EMAILS } },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    console.log(`\nFound ${devUsers.length} developer/test account(s):`);
    devUsers.forEach((u) => {
      console.log(`  ✗ ${u.email} (${u.firstName} ${u.lastName}) — ${u.role}`);
    });

    if (devUsers.length > 0 && !DRY_RUN) {
      const userIds = devUsers.map((u) => u.id);
      // Find bookings by these users
      const userBookings = await prisma.booking.findMany({
        where: { userId: { in: userIds } },
        select: { id: true },
      });
      const bookingIds = userBookings.map((b) => b.id);

      // Delete booking-related records
      if (bookingIds.length > 0) {
        await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.bookingExtra.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
        console.log(`  ✅ Deleted ${bookingIds.length} booking(s) for removed users`);
      }

      // Delete activity log entries
      await prisma.activityLog.deleteMany({ where: { userId: { in: userIds } } });

      // Delete the users
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      console.log(`  ✅ Deleted ${userIds.length} developer account(s)`);
    }
  } else {
    console.log(`\nNo developer emails configured in DEV_EMAILS — skipping account cleanup.`);
    console.log(`  Edit DEV_EMAILS in this script to add accounts to remove.`);
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log(`\n${DRY_RUN
    ? "✅ Dry run complete. Re-run with --apply to apply changes."
    : "✅ Cleanup complete."
  }\n`);
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
