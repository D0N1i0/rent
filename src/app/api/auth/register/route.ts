// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomBytes } from "crypto";
import { addHours } from "date-fns";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmailVerificationEmail } from "@/lib/email";
import { optionalPhoneSchema } from "@/lib/validations/phone";
import { normalizeOptionalPhone } from "@/lib/phone";

const schema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: optionalPhoneSchema,
  nationality: z.string().max(80).optional().or(z.literal("")),
  password: z.string().min(8).max(100).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

export async function POST(req: NextRequest) {
  // Rate limit: 10 registrations per hour per IP
  const ip = getClientIp(req);
  const rl = await rateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input. Please check all fields." }, { status: 400 });
    }

    const { firstName, lastName, email, phone, nationality, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Normalize to E.164 if provided; reject clearly invalid numbers
    let normalizedPhone: string | null = null;
    if (phone?.trim()) {
      const phoneResult = normalizeOptionalPhone(phone);
      if (phoneResult && !phoneResult.ok) {
        return NextResponse.json({ error: "Invalid phone number. Please include your country code (e.g. +383 44 123 456)." }, { status: 400 });
      }
      normalizedPhone = phoneResult?.e164 ?? null;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Use a transaction so email + phone uniqueness checks and user creation are atomic
    const user = await prisma.$transaction(async (tx) => {
      const emailExists = await tx.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
      if (emailExists) {
        throw Object.assign(new Error("EMAIL_TAKEN"), { status: 409 });
      }

      if (normalizedPhone) {
        const phoneExists = await tx.user.findFirst({ where: { phone: normalizedPhone }, select: { id: true } });
        if (phoneExists) {
          throw Object.assign(new Error("PHONE_TAKEN"), { status: 409 });
        }
      }

      return tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: normalizedPhone,
          nationality: nationality?.trim() || null,
          role: "CUSTOMER",
          isActive: true,
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        entity: "User",
        entityId: user.id,
      },
    });

    // Create an email verification token and send the verification email.
    // This is non-blocking — a send failure must not break registration.
    const verificationToken = randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: verificationToken,
        expires: addHours(new Date(), 24),
      },
    }).catch((err) => console.error("[Register] Failed to create verification token:", err));

    sendEmailVerificationEmail(normalizedEmail, verificationToken, firstName).catch((err) =>
      console.error("[Register] Verification email failed:", err)
    );

    return NextResponse.json({ success: true, userId: user.id, requiresVerification: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMAIL_TAKEN") {
        return NextResponse.json({ error: "Registration could not be completed. If you already have an account, please sign in." }, { status: 409 });
      }
      if (error.message === "PHONE_TAKEN") {
        return NextResponse.json({ error: "Registration could not be completed. Please check your details and try again." }, { status: 409 });
      }
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
