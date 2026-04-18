// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100)
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 10 password-change attempts per 15 minutes per user
  const rl = rateLimit(`change-password:${session.user.id}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return tooManyRequests("Too many attempts. Please wait before trying again.", rl.resetAt);
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return NextResponse.json({ error: firstError ?? "Invalid data" }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "No password set for this account" }, { status: 400 });
    }

    const isCorrect = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCorrect) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return NextResponse.json(
        { error: "New password must be different from your current password" },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PASSWORD_CHANGED",
        entity: "User",
        entityId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Change Password] Error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
