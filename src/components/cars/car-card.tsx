// src/components/cars/car-card.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, Fuel, Settings, Wind, ArrowRight, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

export interface CarCardData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  seats: number;
  transmission: string;
  fuelType: string;
  hasAC: boolean;
  isFeatured: boolean;
  sortOrder?: number;
  pricePerDay: number;
  pricePerWeek?: number | null;
  pricePerMonth?: number | null;
  mileageLimit?: number | null;
  images: { id?: string; url: string; alt?: string | null; isPrimary?: boolean | null }[];
  category: { id?: string; name: string; slug: string };
}

interface CarCardProps {
  car: CarCardData;
  pickupLocationId?: string;
  dropoffLocationId?: string;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  durationDays?: number;
}

export function CarCard({
  car,
  pickupLocationId,
  dropoffLocationId,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  durationDays,
}: CarCardProps) {
  const { locale } = useLanguage();
  const [imgError, setImgError] = useState(false);
  const primaryImage = car.images.find((img) => img.isPrimary) ?? car.images[0];

  const fuelLabels: Record<string, string> = {
    PETROL: locale === "al" ? "Benzinë" : "Petrol",
    DIESEL: locale === "al" ? "Naftë" : "Diesel",
    ELECTRIC: locale === "al" ? "Elektrik" : "Electric",
    HYBRID: locale === "al" ? "Hibrid" : "Hybrid",
  };
  const transmissionLabels: Record<string, string> = {
    MANUAL: locale === "al" ? "Manual" : "Manual",
    AUTOMATIC: locale === "al" ? "Automatik" : "Automatic",
  };

  const bookingParams = new URLSearchParams();
  if (pickupLocationId) bookingParams.set("pickupLocationId", pickupLocationId);
  if (dropoffLocationId) bookingParams.set("dropoffLocationId", dropoffLocationId);
  if (pickupDate) bookingParams.set("pickupDate", pickupDate);
  if (pickupTime) bookingParams.set("pickupTime", pickupTime);
  if (returnDate) bookingParams.set("returnDate", returnDate);
  if (returnTime) bookingParams.set("returnTime", returnTime);

  const bookingQuery = bookingParams.toString();
  const carUrl = `/fleet/${car.slug}${bookingQuery ? `?${bookingQuery}` : ""}`;

  const pricingTier = durationDays && durationDays >= 30 && car.pricePerMonth
    ? "monthly"
    : durationDays && durationDays >= 7 && car.pricePerWeek
    ? "weekly"
    : "daily";

  const displayPrice = pricingTier === "monthly" && car.pricePerMonth
    ? car.pricePerMonth / 30
    : pricingTier === "weekly" && car.pricePerWeek
    ? car.pricePerWeek / 7
    : car.pricePerDay;

  const pricingTierLabel =
    pricingTier === "monthly"
      ? locale === "al" ? "çmim mujor" : "monthly rate"
      : pricingTier === "weekly"
      ? locale === "al" ? "çmim javor" : "weekly rate"
      : "";

  return (
    <div className="car-card group flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/10] bg-gray-100">
        {primaryImage?.url && !imgError ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt ?? car.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
            <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
        )}

        <div className="absolute top-3 left-3">
          <span className="bg-navy-900/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {car.category.name}
          </span>
        </div>

        {car.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="bg-crimson-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Star className="h-3 w-3" /> {locale === "al" ? "I Zgjedhur" : "Featured"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="mb-1">
          <p className="text-xs font-semibold text-crimson-500 uppercase tracking-wide">{car.brand}</p>
          <h3 className="text-base font-bold text-navy-900 mt-0.5">{car.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{car.year} · {car.model}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            {car.seats} {locale === "al" ? "vende" : "seats"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Settings className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            {transmissionLabels[car.transmission]}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Fuel className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            {fuelLabels[car.fuelType]}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Wind className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            {car.hasAC ? (locale === "al" ? "Klimatizim" : "Air Con") : (locale === "al" ? "Pa Klimë" : "No A/C")}
          </div>
        </div>

        <div className="mt-auto">
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-xs text-gray-500">{locale === "al" ? "Nga" : "From"}</p>
                {pricingTier !== "daily" && (
                  <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full">
                    {pricingTierLabel}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-navy-900">
                {formatCurrency(displayPrice)}
                <span className="text-sm font-normal text-gray-500">{locale === "al" ? "/ditë" : "/day"}</span>
              </p>
              {car.mileageLimit ? (
                <p className="text-xs text-gray-400">{car.mileageLimit} {locale === "al" ? "km/ditë përfshirë" : "km/day included"}</p>
              ) : (
                <p className="text-xs text-green-600 font-medium">{locale === "al" ? "Kilometrazh i pakufizuar" : "Unlimited mileage"}</p>
              )}
            </div>

            <Link href={carUrl} className="btn-primary text-sm px-4 py-2.5">
              {locale === "al" ? "Rezervo" : "Book"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
