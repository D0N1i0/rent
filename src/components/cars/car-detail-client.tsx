// src/components/cars/car-detail-client.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, Fuel, Settings, Wind, Luggage, ShieldCheck, Calendar,
  MapPin, Clock, ChevronLeft, ChevronRight, Check, Info, ArrowRight,
  Star, CheckCircle2
} from "lucide-react";
import { formatCurrency, calculateRentalDays } from "@/lib/utils";
import { KOSOVO_VAT_RATE } from "@/lib/pricing";
import { CarCard } from "./car-card";
import type { Car, CarImage, CarCategory, Extra, Location } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

type CarWithDetails = Car & { images: CarImage[]; category: CarCategory };
type CarWithMeta = Car & { images: CarImage[]; category: CarCategory };

interface CarDetailClientProps {
  car: CarWithDetails;
  extras: Extra[];
  locations: Location[];
  relatedCars: CarWithMeta[];
  searchParams: Record<string, string>;
}

export function CarDetailClient({ car, extras, locations, relatedCars, searchParams }: CarDetailClientProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const [imgIdx, setImgIdx] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [availability, setAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    reason?: string;
    error?: boolean;
  }>({ checking: false, available: null });

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

  const extraPricingLabels: Record<string, string> = {
    PER_DAY: locale === "al" ? "/ditë" : "/day",
    ONE_TIME: locale === "al" ? " (njëherësh)" : " (one-time)",
    PER_BOOKING: locale === "al" ? " (për rezervim)" : " (per booking)",
  };

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

  const todayStr = today.toISOString().split("T")[0];
  // Minimum pickup time for today: now + 2 hours, rounded up to next 30-min slot
  const minPickupTimeForToday = useMemo(() => {
    const minDT = new Date(today.getTime() + 2 * 60 * 60 * 1000);
    const h = minDT.getHours();
    const m = minDT.getMinutes();
    const [rh, rm] = m === 0 ? [h, 0] : m <= 30 ? [h, 30] : [h + 1 > 23 ? 23 : h + 1, 0];
    return `${rh.toString().padStart(2, "0")}:${rm.toString().padStart(2, "0")}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr]);

  const validPickupTimes = useMemo(
    () => (booking.pickupDate === todayStr ? timeOptions.filter(t => t >= minPickupTimeForToday) : timeOptions),
    [booking.pickupDate, todayStr, minPickupTimeForToday, timeOptions]
  );

  const validReturnTimes = useMemo(
    () => (booking.returnDate === booking.pickupDate ? timeOptions.filter(t => t > booking.pickupTime) : timeOptions),
    [booking.returnDate, booking.pickupDate, booking.pickupTime, timeOptions]
  );

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
  const preTaxTotal = subtotal + extrasTotal + pickupFee + (booking.sameLocation ? 0 : dropoffFee);
  const vatAmount = Number((preTaxTotal * KOSOVO_VAT_RATE).toFixed(2));
  const total = Number((preTaxTotal + vatAmount).toFixed(2));
  const canRequestBooking =
    !!booking.pickupLocationId &&
    !!(booking.sameLocation ? booking.pickupLocationId : booking.dropoffLocationId) &&
    !!booking.pickupDate &&
    !!booking.pickupTime &&
    !!booking.returnDate &&
    !!booking.returnTime &&
    availability.available === true;

  useEffect(() => {
    if (!booking.pickupDate || !booking.pickupTime || !booking.returnDate || !booking.returnTime) {
      setAvailability({ checking: false, available: null });
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      carId: car.id,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      returnDate: booking.returnDate,
      returnTime: booking.returnTime,
    });

    setAvailability({ checking: true, available: null });
    fetch(`/api/cars/availability?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error ?? "Availability check failed");
        }
        return data;
      })
      .then((data) => {
        setAvailability({
          checking: false,
          available: data.available === true,
          reason: data.reason,
          error: false,
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setAvailability({
            checking: false,
            available: null,
            error: true,
            reason: locale === "al"
              ? "Disponueshmeria nuk mund te verifikohet tani. Ju lutemi provoni perseri ose kontaktoni AutoKos."
              : "Availability could not be verified right now. Please try again or contact AutoKos.",
          });
        }
      });

    return () => controller.abort();
  }, [booking.pickupDate, booking.pickupTime, booking.returnDate, booking.returnTime, car.id, locale]);

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
          <Link href="/" className="hover:text-navy-900 transition-colors">{locale === "al" ? "Kreu" : "Home"}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/fleet" className="hover:text-navy-900 transition-colors">{locale === "al" ? "Flotila" : "Fleet"}</Link>
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
                {images[imgIdx]?.url && !imgErrors.has(imgIdx) ? (
                  <Image
                    src={images[imgIdx].url}
                    alt={images[imgIdx].alt ?? car.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    onError={() => setImgErrors(prev => new Set(prev).add(imgIdx))}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <svg className="h-24 w-24 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
                      </svg>
                      <p className="text-sm">{locale === "al" ? "Nuk ka imazh" : "No image available"}</p>
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
                      {img.url && !imgErrors.has(i) ? (
                        <Image src={img.url} alt={img.alt ?? ""} fill className="object-cover" sizes="96px"
                          onError={() => setImgErrors(prev => new Set(prev).add(i))} />
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
                        <Star className="h-3 w-3" /> {locale === "al" ? "I Zgjedhur" : "Featured"}
                      </span>
                    )}
                  </div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900">{car.name}</h1>
                  <p className="text-gray-500 mt-1">{car.year} · {car.brand} {car.model}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-navy-900">{formatCurrency(car.pricePerDay)}<span className="text-base font-normal text-gray-500">{locale === "al" ? "/ditë" : "/day"}</span></p>
                  {car.pricePerWeek && <p className="text-sm text-gray-500">{formatCurrency(car.pricePerWeek)}{locale === "al" ? "/javë" : "/week"}</p>}
                  {car.pricePerMonth && <p className="text-sm text-green-600 font-medium">{formatCurrency(car.pricePerMonth)}{locale === "al" ? "/muaj" : "/month"}</p>}
                </div>
              </div>

              {car.shortDescription && (
                <p className="text-gray-600 border-t border-gray-100 pt-4 mb-4">{car.shortDescription}</p>
              )}

              {/* Specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {[
                  { icon: Users, label: locale === "al" ? "Vende" : "Seats", value: `${car.seats} ${locale === "al" ? "vende" : "seats"}` },
                  { icon: Settings, label: locale === "al" ? "Transmisioni" : "Transmission", value: transmissionLabels[car.transmission] },
                  { icon: Fuel, label: locale === "al" ? "Karburanti" : "Fuel", value: fuelLabels[car.fuelType] },
                  { icon: Wind, label: locale === "al" ? "Klimatizim" : "Air Con", value: car.hasAC ? (locale === "al" ? "Përfshirë" : "Included") : (locale === "al" ? "Pa" : "None") },
                  { icon: Luggage, label: locale === "al" ? "Bagazh" : "Luggage", value: `${car.luggageLarge} ${locale === "al" ? `i madh, ${car.luggageSmall} i vogël` : `large, ${car.luggageSmall} small`}` },
                  { icon: MapPin, label: locale === "al" ? "Dyer" : "Doors", value: `${car.doors} ${locale === "al" ? "dyer" : "doors"}` },
                  { icon: Info, label: locale === "al" ? "Mosha Min." : "Min Age", value: `${car.minAge} ${locale === "al" ? "vjeç" : "years"}` },
                  { icon: ShieldCheck, label: locale === "al" ? "Depozita" : "Deposit", value: formatCurrency(car.deposit) },
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
                <h2 className="font-bold text-navy-900 text-lg mb-3">{locale === "al" ? "Rreth Kësaj Makine" : "About This Car"}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{car.description}</p>
              </div>
            )}

            {/* Features */}
            {car.features.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-navy-900 text-lg mb-4">{locale === "al" ? "Veçoritë e Përfshira" : "Included Features"}</h2>
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
              <h2 className="font-bold text-navy-900 text-lg mb-4">{locale === "al" ? "Kushtet e Qirasë" : "Rental Conditions"}</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-navy-900">{locale === "al" ? "Politika e Karburantit" : "Fuel Policy"}</p>
                    <p className="text-gray-600">{car.fuelPolicy ?? "Full to Full"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{locale === "al" ? "Kilometrazhi" : "Mileage"}</p>
                    <p className="text-gray-600">
                      {car.mileageLimit
                        ? locale === "al"
                          ? `${car.mileageLimit} km/ditë i përfshirë${car.extraKmFee ? `. Shtesë: €${car.extraKmFee}/km` : ""}`
                          : `${car.mileageLimit} km/day included${car.extraKmFee ? `. Extra: €${car.extraKmFee}/km` : ""}`
                        : locale === "al" ? "Kilometrazh i pakufizuar i përfshirë" : "Unlimited mileage included"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{locale === "al" ? "Mosha Minimale e Shoferit" : "Minimum Driver Age"}</p>
                    <p className="text-gray-600">{car.minAge} {locale === "al" ? "vjeç" : "years"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-navy-900">{locale === "al" ? "Patenta e Shoferimit" : "Driving Licence"}</p>
                    <p className="text-gray-600">
                      {locale === "al"
                        ? `E mbajtur për minimum ${car.licenseYears} vit${car.licenseYears !== 1 ? "e" : ""}`
                        : `Held for minimum ${car.licenseYears} year${car.licenseYears !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{locale === "al" ? "Depozita e Sigurisë" : "Security Deposit"}</p>
                    <p className="text-gray-600">{formatCurrency(car.deposit)} ({locale === "al" ? "para-autorizuar, nuk tarifohet" : "pre-authorised, not charged"})</p>
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{locale === "al" ? "Sigurimi" : "Insurance"}</p>
                    <p className="text-gray-600">{locale === "al" ? "Përgjegjësia ndaj palës së tretë e përfshirë. CDW i disponueshëm." : "Third-party liability included. CDW available as extra."}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Extras selection */}
            {extras.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-navy-900 text-lg mb-4">{locale === "al" ? "Shtesa & Shërbime Opsionale" : "Optional Extras & Services"}</h2>
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
                <h2 className="font-bold text-navy-900 text-lg mb-4">{locale === "al" ? "Automjete të Ngjashme" : "Similar Vehicles"}</h2>
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
              <h3 className="font-bold text-navy-900 mb-4">{locale === "al" ? "Rezervo Këtë Makinë" : "Book This Car"}</h3>

              <div className="space-y-3 mb-4">
                {/* Pickup */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{locale === "al" ? "Vendi i Marrjes" : "Pickup Location"}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select value={booking.pickupLocationId} onChange={(e) => setBooking(b => ({ ...b, pickupLocationId: e.target.value }))} className="form-input pl-9 text-sm appearance-none">
                      <option value="">{locale === "al" ? "Zgjidh vendndodhjen" : "Select location"}</option>
                      {locations.filter(l => l.isPickupPoint).map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.isAirport ? "✈ " : ""}{loc.name}{loc.pickupFee > 0 ? ` (+€${loc.pickupFee})` : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Same location toggle */}
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={booking.sameLocation} onChange={e => setBooking(b => ({ ...b, sameLocation: e.target.checked }))} className="h-3.5 w-3.5 rounded" />
                  {locale === "al" ? "Ktheje në të njëjtin vend" : "Return to same location"}
                </label>

                {!booking.sameLocation && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{locale === "al" ? "Vendi i Kthimit" : "Drop-off Location"}</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select value={booking.dropoffLocationId} onChange={(e) => setBooking(b => ({ ...b, dropoffLocationId: e.target.value }))} className="form-input pl-9 text-sm appearance-none">
                        <option value="">{locale === "al" ? "Zgjidh vendndodhjen" : "Select location"}</option>
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{locale === "al" ? "Nga" : "From"}</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input type="date" value={booking.pickupDate} min={todayStr} onChange={(e) => {
                        const newDate = e.target.value;
                        setBooking(b => {
                          const newMinTime = newDate === todayStr ? minPickupTimeForToday : b.pickupTime;
                          const safePickupTime = b.pickupTime >= newMinTime ? b.pickupTime : newMinTime;
                          return { ...b, pickupDate: newDate, pickupTime: safePickupTime };
                        });
                      }} className="form-input pl-8 text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{locale === "al" ? "Ora" : "Time"}</label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <select value={validPickupTimes.includes(booking.pickupTime) ? booking.pickupTime : (validPickupTimes[0] ?? booking.pickupTime)} onChange={(e) => setBooking(b => ({ ...b, pickupTime: e.target.value }))} className="form-input pl-8 text-xs appearance-none">
                        {validPickupTimes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{locale === "al" ? "Deri" : "Until"}</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input type="date" value={booking.returnDate} min={booking.pickupDate} onChange={(e) => setBooking(b => ({ ...b, returnDate: e.target.value }))} className="form-input pl-8 text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{locale === "al" ? "Ora" : "Time"}</label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <select value={validReturnTimes.includes(booking.returnTime) ? booking.returnTime : (validReturnTimes[0] ?? booking.returnTime)} onChange={(e) => setBooking(b => ({ ...b, returnTime: e.target.value }))} className="form-input pl-8 text-xs appearance-none">
                        {validReturnTimes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              {durationDays > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{formatCurrency(effectivePricePerDay)}{locale === "al" ? "/ditë" : "/day"} × {durationDays} {locale === "al" ? `ditë${durationDays !== 1 ? "" : ""}` : `day${durationDays !== 1 ? "s" : ""}`}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {extrasTotal > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{locale === "al" ? "Shtesa" : "Extras"}</span>
                      <span>{formatCurrency(extrasTotal)}</span>
                    </div>
                  )}
                  {pickupFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{locale === "al" ? "Tarifa e marrjes" : "Pickup fee"}</span>
                      <span>{formatCurrency(pickupFee)}</span>
                    </div>
                  )}
                  {!booking.sameLocation && dropoffFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{locale === "al" ? "Tarifa e kthimit" : "Drop-off fee"}</span>
                      <span>{formatCurrency(dropoffFee)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-gray-600">
                    <span>{locale === "al" ? "Nentotali (pa TVSH)" : "Subtotal (excl. VAT)"}</span>
                    <span>{formatCurrency(preTaxTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{locale === "al" ? "TVSH (18%)" : "VAT (18%)"}</span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-navy-900">
                    <span>{locale === "al" ? "Totali (me TVSH)" : "Total (incl. VAT)"}</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>{locale === "al" ? "Depozita e sigurisë (para-auth)" : "Security deposit (pre-auth)"}</span>
                    <span>{formatCurrency(car.deposit)}</span>
                  </div>
                </div>
              )}

              {availability.checking && (
                <p className="text-xs text-gray-500 text-center mb-3">
                  {locale === "al" ? "Duke kontrolluar disponueshmerine..." : "Checking availability..."}
                </p>
              )}
              {availability.available === false && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {availability.reason ?? (locale === "al" ? "Ky automjet nuk eshte i disponueshem per keto data." : "This vehicle is not available for these dates.")}
                </div>
              )}
              {availability.error && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  {availability.reason}
                </div>
              )}

              {/* On mobile, the sticky bottom bar is the primary CTA — only show here on desktop */}
              <button
                onClick={handleBookNow}
                disabled={!canRequestBooking || availability.checking}
                className="hidden lg:flex btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availability.checking
                  ? locale === "al" ? "Duke kontrolluar..." : "Checking..."
                  : locale === "al" ? "Rezervo Tani" : "Reserve Now"} <ArrowRight className="h-5 w-5" />
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                {locale === "al" ? "Anulim i lirë deri 48 orë para marrjes" : "Free cancellation up to 48h before pickup"}
              </p>

              <div className="mt-4 space-y-2">
                {[
                  locale === "al" ? "Konfirmim i menjëhershëm" : "Instant booking confirmation",
                  locale === "al" ? "Sigurimi i plotë i përfshirë" : "Full insurance included",
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

      {/* Sticky mobile Book Now bar — visible only on smaller screens */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 leading-none">{durationDays} {durationDays !== 1 ? (locale === "al" ? "ditë" : "days") : (locale === "al" ? "ditë" : "day")}</p>
          <p className="font-bold text-navy-900 text-base leading-tight">{formatCurrency(total)}</p>
        </div>
        <button
          onClick={handleBookNow}
          disabled={!canRequestBooking || availability.checking}
          className="btn-primary py-3 px-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {availability.checking
            ? locale === "al" ? "Kontroll..." : "Checking..."
            : locale === "al" ? "Rezervo Tani" : "Reserve Now"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom padding so sticky bar doesn't cover content on mobile */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
