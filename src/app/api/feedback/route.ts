// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["COMPLAINT", "SUGGESTION", "FEATURE_REQUEST", "BUG_REPORT", "OTHER"]).default("OTHER"),
  subject: z.string().min(3, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(3000),
  name: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  // Rate limit: 10 submissions per 30 minutes per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`feedback:${ip}`, 10, 30 * 60 * 1000);
  if (!rl.allowed) {
    return tooManyRequests("Too many submissions. Please wait before trying again.", rl.resetAt);
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        type: parsed.data.type,
        subject: parsed.data.subject.trim(),
        message: parsed.data.message.trim(),
        name: parsed.data.name?.trim() || null,
        email: parsed.data.email?.trim() || null,
        status: "NEW",
      },
    });

    return NextResponse.json({ success: true, id: feedback.id }, { status: 201 });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
