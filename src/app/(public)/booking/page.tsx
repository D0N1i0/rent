// src/app/(public)/booking/page.tsx
export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { BookingFormClient } from "@/components/booking/booking-form-client";

interface Props {
  searchParams: Promise<{
    carId?: string;
    pickupLocationId?: string;
    dropoffLocationId?: string;
    pickupDate?: string;
    pickupTime?: string;
    returnDate?: string;
    returnTime?: string;
    extras?: string;
  }>;
}

export default async function BookingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { carId, pickupLocationId, dropoffLocationId, pickupDate, pickupTime, returnDate, returnTime, extras } = sp;

  if (!carId || !pickupLocationId || !pickupDate || !pickupTime || !returnDate || !returnTime) {
    redirect("/fleet");
  }

  const [car, pickupLocation, dropoffLocation, allExtras, session] = await Promise.all([
    prisma.car.findFirst({
      where: { id: carId, isActive: true },
      include: { images: { where: { isPrimary: true } }, category: true, seasonalPricing: { where: { isActive: true } } },
    }),
    prisma.location.findFirst({ where: { id: pickupLocationId, isActive: true } }),
    prisma.location.findFirst({ where: { id: dropoffLocationId ?? pickupLocationId, isActive: true } }),
    prisma.extra.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    auth(),
  ]);

  if (!car || !pickupLocation || !dropoffLocation) redirect("/fleet");

  // Prefill from user profile if logged in
  let userProfile = null;
  if (session?.user?.id) {
    userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true, lastName: true, email: true, phone: true,
        idNumber: true, licenseNumber: true, saveProfileData: true,
      },
    });
  }

  const selectedExtraIds = extras ? extras.split(",").filter(Boolean) : [];
  const selectedExtras = allExtras.filter(e => selectedExtraIds.includes(e.id));

  return (
    <BookingFormClient
      car={car}
      pickupLocation={pickupLocation}
      dropoffLocation={dropoffLocation}
      allExtras={allExtras}
      selectedExtraIds={selectedExtraIds}
      pickupDate={pickupDate}
      pickupTime={pickupTime}
      returnDate={returnDate}
      returnTime={returnTime}
      userProfile={userProfile}
      isLoggedIn={!!session}
    />
  );
}
