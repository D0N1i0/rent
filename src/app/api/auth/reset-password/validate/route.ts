// src/app/api/auth/reset-password/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  try {
    const record = await prisma.passwordReset.findUnique({
      where: { token },
      select: { usedAt: true, expiresAt: true },
    });

    const valid = !!(record && !record.usedAt && record.expiresAt > new Date());
    return NextResponse.json({ valid }, { status: 200 });
  } catch {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
