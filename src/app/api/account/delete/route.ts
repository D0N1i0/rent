// src/app/api/account/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmation: z.literal("DELETE MY ACCOUNT", {
    errorMap: () => ({ message: 'Please type "DELETE MY ACCOUNT" exactly' }),
  }),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true, email: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Incorrect password. Account deletion cancelled." }, { status: 403 });
    }

    // Log the deletion before deleting
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "ACCOUNT_DELETED",
        entity: "User",
        entityId: user.id,
        details: { email: user.email, deletedAt: new Date().toISOString() },
      },
    });

    // Use transaction: cancel active bookings with history, then delete user
    await prisma.$transaction(async (tx) => {
      // Find active bookings to cancel
      const activeBookings = await tx.booking.findMany({
        where: { userId: user.id, status: { in: ["PENDING", "CONFIRMED"] } },
        select: { id: true, status: true },
      });

      for (const booking of activeBookings) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            internalNotes: "Cancelled due to account deletion",
          },
        });
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            fromStatus: booking.status,
            toStatus: "CANCELLED",
            reason: "Account deleted by customer",
            changedById: user.id,
          },
        });
      }

      // Delete the user (cascade deletes sessions, accounts, password resets)
      await tx.user.delete({ where: { id: user.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Failed to delete account. Please try again." }, { status: 500 });
  }
}
