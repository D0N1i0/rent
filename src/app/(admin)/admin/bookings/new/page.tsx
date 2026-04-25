// src/app/(admin)/admin/bookings/new/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ManualBookingForm } from "@/components/admin/manual-booking-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  searchParams: Promise<{ carId?: string; pickupDate?: string }>;
}

export default async function AdminNewBookingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const prefillCarId = sp.carId ?? "";
  const prefillPickupDate = sp.pickupDate ?? "";
  const [cars, locations, extras] = await Promise.all([
    prisma.car.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        brand: true,
        model: true,
        pricePerDay: true,
        deposit: true,
        seasonalPricing: { where: { isActive: true }, select: { id: true } },
      },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    }),
    prisma.location.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        isPickupPoint: true,
        isDropoffPoint: true,
        pickupFee: true,
        dropoffFee: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.extra.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, pricingType: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const pickupLocations = locations.filter((l) => l.isPickupPoint);
  const dropoffLocations = locations.filter((l) => l.isDropoffPoint);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/bookings"
          className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">New Booking</h1>
          <p className="text-gray-500 text-sm mt-0.5">Create a booking on behalf of a customer</p>
        </div>
      </div>

      <ManualBookingForm
        defaultCarId={prefillCarId}
        defaultPickupDate={prefillPickupDate}
        cars={cars.map((c) => ({
          id: c.id,
          name: c.name,
          brand: c.brand,
          model: c.model,
          pricePerDay: Number(c.pricePerDay),
          deposit: Number(c.deposit),
          hasSeasonalPricing: c.seasonalPricing.length > 0,
        }))}
        pickupLocations={pickupLocations.map((l) => ({
          id: l.id,
          name: l.name,
          pickupFee: Number(l.pickupFee ?? 0),
        }))}
        dropoffLocations={dropoffLocations.map((l) => ({
          id: l.id,
          name: l.name,
          dropoffFee: Number(l.dropoffFee ?? 0),
        }))}
        extras={extras.map((e) => ({
          id: e.id,
          name: e.name,
          price: Number(e.price),
          pricingType: e.pricingType,
        }))}
      />
    </div>
  );
}
