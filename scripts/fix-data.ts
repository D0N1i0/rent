/**
 * One-time data patch for pre-launch cleanup.
 * Run: npx tsx scripts/fix-data.ts
 *
 * What it does:
 * 1. Removes old placeholder phone from Terms & Conditions content
 * 2. Clears broken logo_url setting (/images/logo.png doesn't exist)
 * 3. Clears unverified social media placeholder links
 * 4. Marks expired SUMMER15 coupon as inactive
 * 5. Adds hero_stat_customers setting with a truthful value
 * 6. Fixes admin user phone placeholder
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Applying data fixes...\n");

  // 1. Fix Terms & Conditions — remove old placeholder phone
  const terms = await prisma.legalPage.findUnique({ where: { slug: "terms-and-conditions" } });
  if (terms && terms.content.includes("+383 44 123 456")) {
    await prisma.legalPage.update({
      where: { slug: "terms-and-conditions" },
      data: {
        content: terms.content
          .replace(/\+383 44 123 456/g, "+383 49 181 884")
          .replace(/legal@autokos\.com/g, "info@autokos.com"),
      },
    });
    console.log("✅ Terms & Conditions: replaced placeholder phone");
  } else {
    console.log("ℹ️  Terms & Conditions: no old phone found — skipping");
  }

  // 2. Clear broken logo_url (file /images/logo.png does not exist)
  const logoSetting = await prisma.siteSetting.findUnique({ where: { key: "logo_url" } });
  if (logoSetting?.value === "/images/logo.png") {
    await prisma.siteSetting.update({ where: { key: "logo_url" }, data: { value: "" } });
    console.log("✅ logo_url: cleared broken path (was /images/logo.png)");
  } else {
    console.log("ℹ️  logo_url: already updated — skipping");
  }

  // 3. Clear unverified social media placeholder links
  const socialFix: [string, string][] = [
    ["social_facebook", "https://facebook.com/autokos"],
    ["social_instagram", "https://instagram.com/autokos"],
    ["social_tiktok", "https://tiktok.com/@autokos"],
    ["facebook_url", "https://facebook.com/autokos"],
    ["instagram_url", "https://instagram.com/autokos"],
  ];
  for (const [key, placeholderValue] of socialFix) {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (row?.value === placeholderValue) {
      await prisma.siteSetting.update({ where: { key }, data: { value: "" } });
      console.log(`✅ ${key}: cleared placeholder social link`);
    }
  }

  // 4. Mark expired SUMMER15 coupon as inactive
  const summer15 = await prisma.offer.findUnique({ where: { code: "SUMMER15" } });
  if (summer15?.isActive) {
    await prisma.offer.update({ where: { code: "SUMMER15" }, data: { isActive: false } });
    console.log("✅ SUMMER15: marked as inactive (expired 31/08/2025)");
  } else {
    console.log("ℹ️  SUMMER15: already inactive — skipping");
  }

  // 5. Add truthful hero_stat_customers setting
  await prisma.siteSetting.upsert({
    where: { key: "hero_stat_customers" },
    update: { value: "5★ Rated" },
    create: {
      key: "hero_stat_customers",
      value: "5★ Rated",
      group: "homepage",
      label: "Hero Stat: Customers",
      type: "text",
    },
  });
  console.log("✅ hero_stat_customers: set to '5★ Rated'");

  // 6. Fix admin user phone placeholder
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@autokos.com" } });
  if (adminUser?.phone === "+383 44 123 456") {
    await prisma.user.update({
      where: { email: "admin@autokos.com" },
      data: { phone: "+383 49 181 884" },
    });
    console.log("✅ Admin user phone: replaced placeholder");
  } else {
    console.log("ℹ️  Admin user phone: already updated — skipping");
  }

  console.log("\n✅ All data fixes applied.");
  console.log("\n⚠️  Items requiring manual action:");
  console.log("   • Set real Facebook/Instagram URLs in Admin → Settings → Social");
  console.log("   • Upload real logo in Admin → Settings → Branding, update logo_url");
  console.log("   • Enter real Business NIPT in Admin → Settings → Business");
  console.log("   • Verify Stripe webhook at: https://dashboard.stripe.com/webhooks");
  console.log("   • Test SMTP email by triggering a booking confirmation");
}

main()
  .catch((e) => { console.error("❌ Fix failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
