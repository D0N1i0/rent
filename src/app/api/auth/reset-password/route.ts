// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 15 minutes per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`reset-password:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return tooManyRequests("Too many attempts. Please wait before trying again.", rl.resetAt);
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired. Please request a new one." }, { status: 400 });
    }

    // Prevent resetting to the same password
    if (resetRecord.user.passwordHash) {
      const isSame = await bcrypt.compare(password, resetRecord.user.passwordHash);
      if (isSame) {
        return NextResponse.json(
          { error: "New password must be different from your current password." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}
