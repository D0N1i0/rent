// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations/booking";
import { sendContactNotificationEmail } from "@/lib/email";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 5 contact submissions per 30 minutes per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`contact:${ip}`, 5, 30 * 60 * 1000);
  if (!rl.allowed) {
    return tooManyRequests("Too many submissions. Please wait before sending another message.", rl.resetAt);
  }

  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const data = {
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase().trim(),
      phone: parsed.data.phone?.trim() || null,
      subject: parsed.data.subject?.trim() || null,
      message: parsed.data.message.trim(),
    };

    await prisma.contactSubmission.create({ data });

    // Notify admin (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_SERVER_USER;
    if (adminEmail) {
      sendContactNotificationEmail(adminEmail, data).catch((err) =>
        console.error("[Email] Contact notification failed:", err)
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[Contact] Error:", error);
    return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
  }
}
