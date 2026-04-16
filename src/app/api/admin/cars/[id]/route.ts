import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSessionRole, isAdminRole } from "@/lib/authz";
import { carSchema } from "@/lib/validations/booking";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(getSessionRole(session))) return null;
  return session;
}

function normaliseImageUrls(urls: string[] | undefined) {
  return [...new Set((urls ?? []).map((url) => url.trim()).filter(Boolean))].slice(0, 12);
}

async function createUniqueSlug(base: string, currentCarId: string) {
  let slug = slugify(base);
  let counter = 1;
  while (true) {
    const existing = await prisma.car.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === currentCarId) return slug;
    slug = `${slugify(base)}-${counter++}`;
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = carSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const { imageUrls: rawImageUrls, ...carData } = data;
    const imageUrls = normaliseImageUrls(rawImageUrls);
    const slug = await createUniqueSlug(`${data.brand}-${data.model}-${data.year}`, id);

    // Uniqueness checks for VIN and licence plate (excluding current car)
    if (data.vin?.trim()) {
      const existing = await prisma.car.findFirst({ where: { vin: data.vin.trim(), id: { not: id } } });
      if (existing) {
        return NextResponse.json({ error: `VIN "${data.vin.trim()}" is already assigned to another vehicle (${existing.name}).` }, { status: 409 });
      }
    }
    if (data.licensePlate?.trim()) {
      const existing = await prisma.car.findFirst({ where: { licensePlate: data.licensePlate.trim(), id: { not: id } } });
      if (existing) {
        return NextResponse.json({ error: `Licence plate "${data.licensePlate.trim()}" is already assigned to another vehicle (${existing.name}).` }, { status: 409 });
      }
    }

    const car = await prisma.$transaction(async (tx) => {
      const updated = await tx.car.update({
        where: { id },
        data: {
          ...carData,
          slug,
          mileageLimit: carData.mileageLimit ?? null,
          extraKmFee: carData.extraKmFee ?? null,
          pricePerWeek: carData.pricePerWeek ?? null,
          pricePerMonth: carData.pricePerMonth ?? null,
          fuelPolicy: carData.fuelPolicy ?? null,
          description: carData.description ?? null,
          shortDescription: carData.shortDescription ?? null,
          metaTitle: carData.metaTitle ?? null,
          metaDescription: carData.metaDescription ?? null,
        },
      });

      await tx.carImage.deleteMany({ where: { carId: id } });
      if (imageUrls.length > 0) {
        await tx.carImage.createMany({
          data: imageUrls.map((url, index) => ({
            carId: id,
            url,
            isPrimary: index === 0,
            sortOrder: index,
            alt: `${updated.name} image ${index + 1}`,
          })),
        });
      }

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "CAR_UPDATED",
          entity: "Car",
          entityId: updated.id,
          details: { name: updated.name, imageCount: imageUrls.length },
        },
      });

      return updated;
    });

    return NextResponse.json({ car });
  } catch (error) {
    console.error("Update car error:", error);
    return NextResponse.json({ error: "Failed to update car" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const data: { isActive?: boolean; isFeatured?: boolean; sortOrder?: number } = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    const car = await prisma.car.update({ where: { id }, data });
    return NextResponse.json({ car });
  } catch (error) {
    console.error("Patch car error:", error);
    return NextResponse.json({ error: "Failed to update car" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const activeBookings = await prisma.booking.count({
      where: { carId: id, status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] } },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: `Cannot delete: this car has ${activeBookings} active booking(s). Cancel or complete them first.` },
        { status: 409 }
      );
    }

    const car = await prisma.car.findUnique({ where: { id }, select: { name: true } });

    await prisma.$transaction(async (tx) => {
      await tx.carImage.deleteMany({ where: { carId: id } });
      await tx.car.delete({ where: { id } });
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "CAR_DELETED",
          entity: "Car",
          entityId: id,
          details: { name: car?.name },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete car error:", error);
    return NextResponse.json({ error: "Failed to delete car" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      availabilityBlocks: true,
      seasonalPricing: true,
    },
  });

  if (!car) return NextResponse.json({ error: "Car not found" }, { status: 404 });
  return NextResponse.json({ car });
}
