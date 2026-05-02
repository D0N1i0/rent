// src/app/api/bookings/validate-coupon/route.ts
// Validates a coupon code in real-time and returns exact error reason.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { calculateOfferDiscount } from "@/lib/booking-rules";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().positive(),
  durationDays: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  // Two-tier limit:
  //   1. Overall calls — 8 per 10 minutes; a real user needs at most 2-3 attempts.
  //   2. Invalid-code attempts — 3 per hour; makes bulk enumeration impractical.
  // Previous limits (20/5 min overall, 8 invalid/hr) allowed ~192 misses/day per
  // IP, which is low enough for a patient attacker to probe hundreds of codes/day.
  const ip = getClientIp(req);
  const rl = await rateLimit(`coupon-validate:${ip}`, 8, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ valid: false, error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });

    const { code, subtotal, durationDays } = parsed.data;
    const normalizedCode = code.trim().toUpperCase();

    const offer = await prisma.offer.findFirst({
      where: { code: normalizedCode },
    });

    if (!offer) {
      // Count invalid attempts separately — 3 misses per hour keeps enumeration
      // impractical while being sufficient for any real user.
      const miss = await rateLimit(`coupon-invalid:${ip}`, 3, 60 * 60 * 1000);
      if (!miss.allowed) {
        return NextResponse.json(
          { valid: false, error: "Too many invalid attempts. Please try again later." },
          { status: 429 }
        );
      }
      return NextResponse.json({ valid: false, error: "Invalid coupon code" });
    }

    if (!offer.isActive) {
      return NextResponse.json({ valid: false, error: "This coupon is no longer active" });
    }

    const now = new Date();
    if (offer.validFrom && now < offer.validFrom) {
      return NextResponse.json({ valid: false, error: `This coupon is not valid yet. It becomes active on ${offer.validFrom.toLocaleDateString("en-GB")}` });
    }
    if (offer.validUntil && now > offer.validUntil) {
      return NextResponse.json({ valid: false, error: `This coupon expired on ${offer.validUntil.toLocaleDateString("en-GB")}` });
    }
    if (offer.minSubtotal != null && subtotal < Number(offer.minSubtotal)) {
      return NextResponse.json({
        valid: false,
        error: `Minimum booking subtotal of €${Number(offer.minSubtotal).toFixed(2)} required (your subtotal: €${subtotal.toFixed(2)})`,
      });
    }
    if (offer.minRentalDays != null && durationDays < offer.minRentalDays) {
      return NextResponse.json({
        valid: false,
        error: `Minimum ${offer.minRentalDays} day${offer.minRentalDays !== 1 ? "s" : ""} rental required (your booking: ${durationDays} day${durationDays !== 1 ? "s" : ""})`,
      });
    }

    const discountAmount = calculateOfferDiscount({ offer, subtotal, durationDays });

    const description =
      offer.discountPct && offer.discountAmt
        ? `${offer.discountPct}% + €${Number(offer.discountAmt).toFixed(2)} off`
        : offer.discountPct
        ? `${offer.discountPct}% off`
        : offer.discountAmt
        ? `€${Number(offer.discountAmt).toFixed(2)} off`
        : "Discount applied";

    return NextResponse.json({
      valid: true,
      discountAmount,
      description,
      offerTitle: offer.title,
    });
  } catch (error) {
    console.error("[Coupon Validate] Error:", error);
    return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}
