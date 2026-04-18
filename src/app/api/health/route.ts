// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db: "ok",
      responseMs: Date.now() - start,
    });
  } catch (err) {
    console.error("[Health] DB check failed:", err);
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        db: "error",
        responseMs: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
