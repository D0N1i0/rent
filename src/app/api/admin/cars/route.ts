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

async function createUniqueSlug(base: string) {
  let slug = slugify(base);
  let counter = 1;
  while (await prisma.car.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${counter++}`;
  }
  return slug;
}

export async function POST(req: NextRequest) {
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
    const slug = await createUniqueSlug(`${data.brand}-${data.model}-${data.year}`);

    // Uniqueness checks for VIN and licence plate
    if (data.vin?.trim()) {
      const existing = await prisma.car.findFirst({ where: { vin: data.vin.trim() } });
      if (existing) {
        return NextResponse.json({ error: `VIN "${data.vin.trim()}" is already assigned to another vehicle (${existing.name}).` }, { status: 409 });
      }
    }
    if (data.licensePlate?.trim()) {
      const existing = await prisma.car.findFirst({ where: { licensePlate: data.licensePlate.trim() } });
      if (existing) {
        return NextResponse.json({ error: `Licence plate "${data.licensePlate.trim()}" is already assigned to another vehicle (${existing.name}).` }, { status: 409 });
      }
    }

    const car = await prisma.$transaction(async (tx) => {
      const created = await tx.car.create({
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

      if (imageUrls.length > 0) {
        await tx.carImage.createMany({
          data: imageUrls.map((url, index) => ({
            carId: created.id,
            url,
            isPrimary: index === 0,
            sortOrder: index,
            alt: `${created.name} image ${index + 1}`,
          })),
        });
      }

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "CAR_CREATED",
          entity: "Car",
          entityId: created.id,
          details: { name: created.name, imageCount: imageUrls.length },
        },
      });

      return created;
    });

    return NextResponse.json({ car }, { status: 201 });
  } catch (error) {
    console.error("Create car error:", error);
    return NextResponse.json({ error: "Failed to create car" }, { status: 500 });
  }
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const cars = await prisma.car.findMany({
    include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({ cars });
}
