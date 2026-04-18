// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

const schema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(7).max(25).optional().or(z.literal("")),
  nationality: z.string().max(80).optional().or(z.literal("")),
  password: z.string().min(8).max(100).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

export async function POST(req: NextRequest) {
  // Rate limit: 10 registrations per hour per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return tooManyRequests("Too many registration attempts. Please try again later.", rl.resetAt);
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input. Please check all fields." }, { status: 400 });
    }

    const { firstName, lastName, email, phone, nationality, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone?.trim() || null;

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

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMAIL_TAKEN") {
        return NextResponse.json({ error: "An account with this email already exists. Please sign in instead." }, { status: 409 });
      }
      if (error.message === "PHONE_TAKEN") {
        return NextResponse.json({ error: "This phone number is already registered. Please use a different number or sign in." }, { status: 409 });
      }
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
