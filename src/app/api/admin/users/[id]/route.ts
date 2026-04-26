// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isAdminRole, getSessionRole } from "@/lib/authz";
import { z } from "zod";
import { optionalPhoneSchema } from "@/lib/validations/phone";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN") return null;
  return session;
}

const patchSchema = z.object({
  role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().min(2).max(50).optional().or(z.literal("")),
  lastName: z.string().min(2).max(50).optional().or(z.literal("")),
  phone: z.union([optionalPhoneSchema, z.null()]).optional(),
  dateOfBirth: z.string().optional().nullable().or(z.literal("")),
  nationality: z.string().max(80).optional().nullable().or(z.literal("")),
  idNumber: z.string().max(50).optional().nullable().or(z.literal("")),
  licenseNumber: z.string().max(50).optional().nullable().or(z.literal("")),
  address: z.string().max(200).optional().nullable().or(z.literal("")),
  city: z.string().max(100).optional().nullable().or(z.literal("")),
  country: z.string().max(100).optional().nullable().or(z.literal("")),
  notes: z.string().max(2000).optional().nullable().or(z.literal("")),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot modify your own account via admin" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;

    // Uniqueness checks (phone, idNumber, licenseNumber) — only when provided and non-empty
    const phone = d.phone?.trim() || null;
    const idNumber = d.idNumber?.trim() || null;
    const licenseNumber = d.licenseNumber?.trim() || null;

    if (phone) {
      const existing = await prisma.user.findFirst({ where: { phone, id: { not: id } } });
      if (existing) return NextResponse.json({ error: "Phone number is already linked to another account." }, { status: 409 });
    }
    if (idNumber) {
      const existing = await prisma.user.findFirst({ where: { idNumber, id: { not: id } } });
      if (existing) return NextResponse.json({ error: "ID / passport number is already linked to another account." }, { status: 409 });
    }
    if (licenseNumber) {
      const existing = await prisma.user.findFirst({ where: { licenseNumber, id: { not: id } } });
      if (existing) return NextResponse.json({ error: "Driving licence number is already linked to another account." }, { status: 409 });
    }

    const updateData: Record<string, unknown> = {};
    if (d.role !== undefined) updateData.role = d.role;
    if (d.isActive !== undefined) updateData.isActive = d.isActive;
    if (d.firstName !== undefined) updateData.firstName = d.firstName?.trim() || null;
    if (d.lastName !== undefined) updateData.lastName = d.lastName?.trim() || null;
    if ("phone" in d) updateData.phone = phone;
    if ("dateOfBirth" in d) {
      updateData.dateOfBirth = d.dateOfBirth?.trim()
        ? new Date(d.dateOfBirth.trim())
        : null;
    }
    if ("nationality" in d) updateData.nationality = d.nationality?.trim() || null;
    if ("idNumber" in d) updateData.idNumber = idNumber;
    if ("licenseNumber" in d) updateData.licenseNumber = licenseNumber;
    if ("address" in d) updateData.address = d.address?.trim() || null;
    if ("city" in d) updateData.city = d.city?.trim() || null;
    if ("country" in d) updateData.country = d.country?.trim() || null;
    if ("notes" in d) updateData.notes = d.notes?.trim() || null;

    const user = await prisma.user.update({ where: { id }, data: updateData });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "USER_UPDATED",
        entity: "User",
        entityId: id,
        details: { updatedFields: Object.keys(updateData) },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 403 });
  }

  try {
    // Unlink bookings (set userId to null) before deleting user to preserve booking history
    await prisma.booking.updateMany({ where: { userId: id }, data: { userId: null } });

    // Delete the user (cascade deletes sessions, accounts, passwordResets, activityLogs, feedback)
    await prisma.user.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "USER_DELETED",
        entity: "User",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: {
        include: { car: { select: { name: true } }, pickupLocation: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { bookings: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}
