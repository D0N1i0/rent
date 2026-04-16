// src/components/cars/car-detail-client.tsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, Fuel, Settings, Wind, Luggage, ShieldCheck, Calendar,
  MapPin, Clock, ChevronLeft, ChevronRight, Check, Info, ArrowRight,
  Star, CheckCircle2
} from "lucide-react";
import { formatCurrency, calculateRentalDays } from "@/lib/utils";
import { CarCard } from "./car-card";
import type { Car, CarImage, CarCategory, Extra, Location } from "@prisma/client";
import { cn } from "@/lib/utils";

type CarWithDetails = Car & { images: CarImage[]; category: CarCategory };
type CarWithMeta = Car & { images: CarImage[]; category: CarCategory };

interface CarDetailClientProps {
  car: CarWithDetails;
  extras: Extra[];
  locations: Location[];
  relatedCars: CarWithMeta[];
  searchParams: Record<string, string>;
}

const fuelLabels: Record<string, string> = { PETROL: "Petrol", DIESEL: "Diesel", ELECTRIC: "Electric", HYBRID: "Hybrid" };
const transmissionLabels: Record<string, string> = { MANUAL: "Manual", AUTOMATIC: "Automatic" };
const extraPricingLabels: Record<string, string> = { PER_DAY: "/day", ONE_TIME: " (one-time)", PER_BOOKING: " (per booking)" };

export function CarDetailClient({ car, extras, locations, relatedCars, searchParams }: CarDetailClientProps) {
  const router = useRouter();
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDays = new Date(today); threeDays.setDate(threeDays.getDate() + 3);

  const [booking, setBooking] = useState({
    pickupLocationId: searchParams.pickupLocationId ?? "",
    dropoffLocationId: searchParams.dropoffLocationId ?? searchParams.pickupLocationId ?? "",
    sameLocation: !searchParams.dropoffLocationId || searchParams.dropoffLocationId === searchParams.pickupLocationId,
    pickupDate: searchParams.pickupDate ?? tomorrow.toISOString().split("T")[0],
    pickupTime: searchParams.pickupTime ?? "10:00",
    returnDate: searchParams.returnDate ?? threeDays.toISOString().split("T")[0],
    returnTime: searchParams.returnTime ?? "10:00",
  });

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, "0");
    const m = i % 2 === 0 ? "00" : "30";
    return `${h}:${m}`;
  });

  const durationDays = useMemo(() => {
    if (!booking.pickupDate || !booking.pickupTime || !booking.returnDate || !booking.returnTime) return 1;
    const pickup = new Date(`${booking.pickupDate}T${booking.pickupTime}:00`);
    const ret = new Date(`${booking.returnDate}T${booking.returnTime}:00`);
    const days = calculateRentalDays(pickup, ret);
    return days > 0 ? days : 1;
  }, [booking]);

  const effectivePricePerDay = useMemo(() => {
    if (durationDays >= 30 && car.pricePerMonth) return car.pricePerMonth / 30;
    if (durationDays >= 7 && car.pricePerWeek) return car.pricePerWeek / 7;
    return car.pricePerDay;
  }, [durationDays, car]);

  const pickupLoc = locations.find(l => l.id === booking.pickupLocationId);
  const dropoffLoc = locations.find(l => l.id === (booking.sameLocation ? booking.pickupLocationId : booking.dropoffLocationId));

  const extrasTotal = useMemo(() => {
    return selectedExtras.reduce((sum, extraId) => {
      const extra = extras.find(e => e.id === extraId);
      if (!extra) return sum;
      if (extra.pricingType === "PER_DAY") return sum + extra.price * durationDays;
      return sum + extra.price;
    }, 0);
  }, [selectedExtras, extras, durationDays]);

  const subtotal = effectivePricePerDay * durationDays;
  const pickupFee = pickupLoc?.pickupFee ?? 0;
  const dropoffFee = dropoffLoc?.dropoffFee ?? 0;
  const total = subtotal + extrasTotal + pickupFee + (booking.sameLocation ? 0 : dropoffFee);

  const toggleExtra = (id: string) => {
    setSelectedExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const handleBookNow = () => {
    const params = new URLSearchParams({
      carId: car.id,
      pickupLocationId: booking.pickupLocationId,
      dropoffLocationId: booking.sameLocation ? booking.pickupLocationId : booking.dropoffLocationId,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      returnDate: booking.returnDate,
      returnTime: booking.returnTime,
      extras: selectedExtras.join(","),
    });
    router.push(`/booking?${params.toString()}`);
  };

  const images = car.images.length > 0 ? car.images : [{ id: "placeholder", url: "", alt: car.name, isPrimary: true, sortOrder: 0, carId: car.id }];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-navy-900 transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/fleet" className="hover:text-navy-900 transition-colors">Fleet</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-navy-900 font-medium">{car.name}</span>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Car info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative aspect-[16/10] bg-gray-100">
                {images[imgIdx]?.url ? (
                  <Image
                    src={images[imgIdx].url}
                    alt={images[imgIdx].alt ?? car.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <svg className="h-24 w-24 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
                      </svg>
                      <p className="text-sm">No image available</p>
                    </div>
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIdx(prev => prev === 0 ? images.length - 1 : prev - 1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-navy-900" />
                    </button>
                    <button
                      onClick={() => setImgIdx(prev => prev === images.length - 1 ? 0 : prev + 1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-navy-900" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setImgIdx(i)}
                      className={cn("relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-colors", i === imgIdx ? "border-navy-900" : "border-transparent hover:border-gray-300")}
                    >
                      {img.url ? (
                        <Image src={img.url} alt={img.alt ?? ""} fill className="object-cover" sizes="96px" />
                      ) : (
                        <div className="bg-gray-100 h-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Car info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold bg-navy-100 text-navy-700 px-2.5 py-1 rounded-full">{car.category.name}</span>
                    {car.isFeatured && (
                      <span className="text-xs font-semibold bg-crimson-50 text-crimson-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    )}
                  </div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900">{car.name}</h1>
                  <p className="text-gray-500 mt-1">{car.year} · {car.brand} {car.model}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-navy-900">{formatCurrency(car.pricePerDay)}<span className="text-base font-normal text-gray-500">/day</span></p>
                  {car.pricePerWeek && <p className="text-sm text-gray-500">{formatCurrency(car.pricePerWeek)}/week</p>}
                  {car.pricePerMonth && <p className="text-sm text-green-600 font-medium">{formatCurrency(car.pricePerMonth)}/month</p>}
                </div>
              </div>

              {car.shortDescription && (
                <p className="text-gray-600 border-t border-gray-100 pt-4 mb-4">{car.shortDescription}</p>
              )}

              {/* Specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {[
                  { icon: Users, label: "Seats", value: `${car.seats} seats` },
                  { icon: Settings, label: "Transmission", value: transmissionLabels[car.transmission] },
                  { icon: Fuel, label: "Fuel", value: fuelLabels[car.fuelType] },
                  { icon: Wind, label: "Air Con", value: car.hasAC ? "Included" : "None" },
                  { icon: Luggage, label: "Luggage", value: `${car.luggageLarge} large, ${car.luggageSmall} small` },
                  { icon: MapPin, label: "Doors", value: `${car.doors} doors` },
                  { icon: Info, label: "Min Age", value: `${car.minAge} years` },
                  { icon: ShieldCheck, label: "Deposit", value: formatCurrency(car.deposit) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <Icon className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-navy-900 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {car.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-navy-900 text-lg mb-3">About This Car</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{car.description}</p>
              </div>
            )}

            {/* Features */}
            {car.features.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-navy-900 text-lg mb-4">Included Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {car.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rental policies */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-navy-900 text-lg mb-4">Rental Conditions</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-navy-900">Fuel Policy</p>
                    <p className="text-gray-600">{car.fuelPolicy ?? "Full to Full"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">Mileage</p>
                    <p className="text-gray-600">
                      {car.mileageLimit ? `${car.mileageLimit} km/day included${car.extraKmFee ? `. Extra: €${car.extraKmFee}/km` : ""}` : "Unlimited mileage included"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">Minimum Driver Age</p>
                    <p className="text-gray-600">{car.minAge} years</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-navy-900">Driving Licence</p>
                    <p className="text-gray-600">Held for minimum {car.licenseYears} year{car.licenseYears !== 1 ? "s" : ""}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">Security Deposit</p>
                    <p className="text-gray-600">{formatCurrency(car.deposit)} (pre-authorised, not charged)</p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">Insurance</p>
                    <p className="text-gray-600">Third-party liability included. CDW available.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Extras selection */}
            {extras.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-navy-900 text-lg mb-4">Optional Extras & Services</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {extras.map((extra) => (
                    <button
                      key={extra.id}
                      onClick={() => toggleExtra(extra.id)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                        selectedExtras.includes(extra.id)
                          ? "border-navy-900 bg-navy-50"
                          : "border-gray-100 hover:border-navy-200 bg-white"
                      )}
                    >
                      <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors", selectedExtras.includes(extra.id) ? "bg-navy-900 border-navy-900" : "border-gray-300")}>
                        {selectedExtras.includes(extra.id) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-navy-900">{extra.name}</p>
                          <p className="text-sm font-bold text-crimson-600 shrink-0">
                            +{formatCurrency(extra.price)}{extraPricingLabels[extra.pricingType]}
                          </p>
                        </div>
                        {extra.description && <p className="text-xs text-gray-500 mt-0.5">{extra.description}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Related cars */}
            {relatedCars.length > 0 && (
              <div>
                <h2 className="font-bold text-navy-900 text-lg mb-4">You Might Also Like</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {relatedCars.map((rc) => (
                    <CarCard key={rc.id} car={rc} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking panel (sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h3 className="font-bold text-navy-900 mb-4">Book This Car</h3>

              <div className="space-y-3 mb-4">
                {/* Pickup */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Pickup Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select value={booking.pickupLocationId} onChange={(e) => setBooking(b => ({ ...b, pickupLocationId: e.target.value }))} className="form-input pl-9 text-sm appearance-none">
                      <option value="">Select location</option>
                      {locations.filter(l => l.isPickupPoint).map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.isAirport ? "✈ " : ""}{loc.name}{loc.pickupFee > 0 ? ` (+€${loc.pickupFee})` : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Same location toggle */}
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={booking.sameLocation} onChange={e => setBooking(b => ({ ...b, sameLocation: e.target.checked }))} className="h-3.5 w-3.5 rounded" />
                  Return to same location
                </label>

                {!booking.sameLocation && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Drop-off Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select value={booking.dropoffLocationId} onChange={(e) => setBooking(b => ({ ...b, dropoffLocationId: e.target.value }))} className="form-input pl-9 text-sm appearance-none">
                        <option value="">Select location</option>
                        {locations.filter(l => l.isDropoffPoint).map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">From</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input type="date" value={booking.pickupDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setBooking(b => ({ ...b, pickupDate: e.target.value }))} className="form-input pl-8 text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Time</label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <select value={booking.pickupTime} onChange={(e) => setBooking(b => ({ ...b, pickupTime: e.target.value }))} className="form-input pl-8 text-xs appearance-none">
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Until</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input type="date" value={booking.returnDate} min={booking.pickupDate} onChange={(e) => setBooking(b => ({ ...b, returnDate: e.target.value }))} className="form-input pl-8 text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Time</label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <select value={booking.returnTime} onChange={(e) => setBooking(b => ({ ...b, returnTime: e.target.value }))} className="form-input pl-8 text-xs appearance-none">
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              {durationDays > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{formatCurrency(effectivePricePerDay)}/day × {durationDays} day{durationDays !== 1 ? "s" : ""}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {extrasTotal > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Extras</span>
                      <span>{formatCurrency(extrasTotal)}</span>
                    </div>
                  )}
                  {pickupFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Pickup fee</span>
                      <span>{formatCurrency(pickupFee)}</span>
                    </div>
                  )}
                  {!booking.sameLocation && dropoffFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Drop-off fee</span>
                      <span>{formatCurrency(dropoffFee)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-navy-900">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Security deposit (pre-auth)</span>
                    <span>{formatCurrency(car.deposit)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBookNow}
                disabled={!booking.pickupLocationId || !booking.pickupDate || !booking.returnDate}
                className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reserve Now <ArrowRight className="h-5 w-5" />
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">Free cancellation · No credit card needed to reserve</p>

              <div className="mt-4 space-y-2">
                {[
                  "Instant booking confirmation",
                  "Full insurance included",
                  "24/7 WhatsApp support",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
