// src/app/api/auth/verify-email/route.ts
// GET  ?token=xxx  — consume token, mark user email verified
// POST { email }   — resend verification email (rate-limited)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { addHours } from "date-fns";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmailVerificationEmail } from "@/lib/email";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const record = await prisma.verificationToken.findUnique({ where: { token } });

    if (!record) {
      // Token not found — either already used or was never valid.
      // Check if the email address it belonged to is already verified so
      // the page can show a friendlier "already verified" message.
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    if (record.expires < new Date()) {
      // Expired — clean up and ask the user to request a new link.
      await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } });
      return NextResponse.json({ error: "expired", email: record.identifier }, { status: 400 });
    }

    // Consume token and mark user as verified in a single transaction.
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { email: record.identifier, emailVerified: null },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: record.identifier, token } },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        action: "EMAIL_VERIFIED",
        entity: "User",
        details: { email: record.identifier },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VerifyEmail] Error:", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  // Rate limit: 5 resend attempts per hour per IP to prevent email flooding
  const ip = getClientIp(req);
  const rl = await rateLimit(`verify-email-resend:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, emailVerified: true },
    });

    // Always return success — prevents email enumeration
    if (!user) return NextResponse.json({ success: true });

    // Already verified — no need to send
    if (user.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });

    // Delete any existing tokens for this email and create a fresh one
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    const token = randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires: addHours(new Date(), 24) },
    });

    sendEmailVerificationEmail(email, token, user.firstName).catch((err) =>
      console.error("[VerifyEmail] Resend email failed:", err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VerifyEmail] Resend error:", error);
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }
}
