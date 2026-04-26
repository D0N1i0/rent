// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { profileSchema, isAtLeast18 } from "@/lib/validations/auth";
import { normalizeOptionalPhone } from "@/lib/phone";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      dateOfBirth: true, nationality: true, idNumber: true, licenseNumber: true,
      address: true, city: true, country: true, saveProfileData: true, createdAt: true,
    },
  });

  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const userId = session.user.id;

    // DOB 18+ server-side enforcement
    if (data.dateOfBirth?.trim()) {
      if (!isAtLeast18(data.dateOfBirth)) {
        return NextResponse.json({ error: "You must be at least 18 years old to register." }, { status: 400 });
      }
    }

    // Normalize phone to E.164 before uniqueness check and write
    let normalizedPhone: string | null = null;
    if (data.phone?.trim()) {
      const phoneResult = normalizeOptionalPhone(data.phone);
      if (phoneResult && !phoneResult.ok) {
        return NextResponse.json({ error: "Invalid phone number. Please include your country code (e.g. +383 44 123 456)." }, { status: 400 });
      }
      normalizedPhone = phoneResult?.e164 ?? null;
    }

    // Uniqueness checks — only check if value is non-empty and belongs to another user
    if (normalizedPhone) {
      const existing = await prisma.user.findFirst({
        where: { phone: normalizedPhone, id: { not: userId } },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ error: "This phone number is already linked to another account." }, { status: 409 });
      }
    }

    if (data.idNumber?.trim()) {
      const existing = await prisma.user.findFirst({
        where: { idNumber: data.idNumber.trim(), id: { not: userId } },
      });
      if (existing) {
        return NextResponse.json({ error: "This ID / passport number is already linked to another account. Please contact support if you believe this is an error." }, { status: 409 });
      }
    }

    if (data.licenseNumber?.trim()) {
      const existing = await prisma.user.findFirst({
        where: { licenseNumber: data.licenseNumber.trim(), id: { not: userId } },
      });
      if (existing) {
        return NextResponse.json({ error: "This driving licence number is already linked to another account. Please contact support if you believe this is an error." }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: normalizedPhone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        nationality: data.nationality?.trim() || null,
        idNumber: data.idNumber?.trim() || null,
        licenseNumber: data.licenseNumber?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        country: data.country?.trim() || null,
        saveProfileData: data.saveProfileData,
      },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    await prisma.activityLog.create({
      data: { userId, action: "PROFILE_UPDATED", entity: "User", entityId: userId },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
