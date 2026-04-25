// src/app/api/admin/bookings/preview/route.ts
// Returns a live price breakdown for the admin manual booking form.
// No booking is created; this is read-only for the UI preview.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { buildPriceBreakdown, buildExtraLineItems } from "@/lib/pricing";
import { buildBookingDateTimes, calculateOfferDiscount, getDurationDays } from "@/lib/booking-rules";
import { adminBookingPreviewSchema } from "@/lib/validations/admin-booking";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminBookingPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request: " + (parsed.error.issues[0]?.message ?? "Validation failed") },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const { pickupDT, returnDT } = buildBookingDateTimes({
    pickupDate: data.pickupDate,
    pickupTime: data.pickupTime,
    returnDate: data.returnDate,
    returnTime: data.returnTime,
  });

  if (Number.isNaN(pickupDT.getTime()) || Number.isNaN(returnDT.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (returnDT <= pickupDT) {
    return NextResponse.json({ error: "Return must be after pickup" }, { status: 400 });
  }

  const [car, pickupLoc, dropoffLoc] = await Promise.all([
    prisma.car.findFirst({
      where: { id: data.carId, isActive: true },
      include: { seasonalPricing: { where: { isActive: true } } },
    }),
    prisma.location.findFirst({ where: { id: data.pickupLocationId, isActive: true } }),
    prisma.location.findFirst({ where: { id: data.dropoffLocationId, isActive: true } }),
  ]);

  if (!car || !pickupLoc || !dropoffLoc) {
    return NextResponse.json({ error: "Car or location not found" }, { status: 404 });
  }

  const selectedExtraIds = Array.from(new Set(data.selectedExtras));
  let extraLineItems: ReturnType<typeof buildExtraLineItems> = [];
  if (selectedExtraIds.length > 0) {
    const extraRecords = await prisma.extra.findMany({
      where: { id: { in: selectedExtraIds }, isActive: true },
    });
    const durationDays = getDurationDays(pickupDT, returnDT);
    extraLineItems = buildExtraLineItems(extraRecords, selectedExtraIds, durationDays);
  }

  const normalizedCoupon = typeof data.couponCode === "string"
    ? data.couponCode.trim().toUpperCase()
    : "";

  let couponDiscount = 0;
  let couponValid = false;
  let couponError: string | null = null;

  if (normalizedCoupon) {
    const offer = await prisma.offer.findFirst({ where: { code: normalizedCoupon } });
    if (!offer) {
      couponError = "Coupon code not found";
    } else {
      const provisional = buildPriceBreakdown(car, pickupDT, returnDT, pickupLoc, dropoffLoc, extraLineItems);
      couponDiscount = calculateOfferDiscount({
        offer,
        subtotal: provisional.subtotal + provisional.extrasTotal + provisional.pickupFee + provisional.dropoffFee,
        durationDays: provisional.durationDays,
      });
      if (couponDiscount === 0) {
        couponError = "Coupon conditions not met (minimum days or amount not reached)";
      } else {
        couponValid = true;
      }
    }
  }

  const breakdown = buildPriceBreakdown(car, pickupDT, returnDT, pickupLoc, dropoffLoc, extraLineItems, couponDiscount);

  return NextResponse.json({ breakdown, couponValid, couponError, couponDiscount });
}
