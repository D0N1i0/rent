// src/components/booking/booking-form-client.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Loader2, Check, User, Car, MapPin, Calendar, ChevronRight, Shield, Info, Tag, CheckCircle, XCircle } from "lucide-react";
import { bookingSchema, type BookingFormValues } from "@/lib/validations/booking";
import { formatCurrency } from "@/lib/utils";
import { buildPriceBreakdown, buildExtraLineItems, KOSOVO_VAT_RATE } from "@/lib/pricing";
import { buildBookingDateTimes, getDurationDays } from "@/lib/booking-rules";
import type { Car as CarType, CarImage, CarCategory, Extra, Location } from "@prisma/client";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelect } from "@/components/ui/country-select";
import { useT, useLanguage } from "@/lib/i18n/context";

type CarWithDetails = CarType & { images: CarImage[]; category: CarCategory };

interface BookingFormClientProps {
  car: CarWithDetails;
  pickupLocation: Location;
  dropoffLocation: Location;
  allExtras: Extra[];
  selectedExtraIds: string[];
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  userProfile: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    idNumber?: string | null;
    licenseNumber?: string | null;
    saveProfileData: boolean;
  } | null;
  isLoggedIn: boolean;
}

export function BookingFormClient({
  car, pickupLocation, dropoffLocation, allExtras, selectedExtraIds,
  pickupDate, pickupTime, returnDate, returnTime, userProfile, isLoggedIn,
}: BookingFormClientProps) {
  const router = useRouter();
  const t = useT();
  const { locale } = useLanguage();
  const extraPricingLabels: Record<string, string> = {
    PER_DAY: locale === "al" ? "/ditë" : "/day",
    ONE_TIME: locale === "al" ? " (njëherësh)" : " (one-time)",
    PER_BOOKING: locale === "al" ? " (për rezervim)" : " (per booking)",
  };
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>(selectedExtraIds);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const pricePreview = useMemo(() => {
    const { pickupDT, returnDT } = buildBookingDateTimes({ pickupDate, pickupTime, returnDate, returnTime });
    const selectedExtraRecords = allExtras.filter((extra) => selectedExtras.includes(extra.id));
    const extras = buildExtraLineItems(selectedExtraRecords, selectedExtras, getDurationDays(pickupDT, returnDT));
    return buildPriceBreakdown(car, pickupDT, returnDT, pickupLocation, dropoffLocation, extras, couponApplied?.discount ?? 0, KOSOVO_VAT_RATE);
  }, [allExtras, car, couponApplied, dropoffLocation, pickupDate, pickupLocation, pickupTime, returnDate, returnTime, selectedExtras]);

  const durationDays = pricePreview.durationDays;
  const effectivePricePerDay = pricePreview.pricePerDay;
  const subtotal = pricePreview.subtotal;
  const extrasTotal = pricePreview.extrasTotal;
  const pickupFee = pricePreview.pickupFee;
  const dropoffFee = pricePreview.dropoffFee;
  const vatAmount = pricePreview.vatAmount;
  const preTaxTotal = pricePreview.preTaxTotal;
  const total = pricePreview.totalAmount;

  const validateCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponApplied(null);

    try {
      const res = await fetch("/api/bookings/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: pricePreview.subtotal + pricePreview.extrasTotal + pricePreview.pickupFee + pricePreview.dropoffFee,
          durationDays: pricePreview.durationDays,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponApplied({ code: couponCode.trim().toUpperCase(), discount: data.discountAmount, description: data.description });
      } else {
        setCouponError(data.error ?? "Invalid coupon code");
      }
    } catch {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, pricePreview]);

  const {
    register, control, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      carId: car.id,
      pickupLocationId: pickupLocation.id,
      dropoffLocationId: dropoffLocation.id,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      firstName: userProfile?.firstName ?? "",
      lastName: userProfile?.lastName ?? "",
      email: userProfile?.email ?? "",
      phone: userProfile?.phone ?? "",
      idNumber: userProfile?.idNumber ?? "",
      licenseNumber: userProfile?.licenseNumber ?? "",
      nationality: "",
      selectedExtras: selectedExtraIds,
      specialRequests: "",
      acceptTerms: false,
      acceptCancellation: false,
    },
  });

  const toggleExtra = (id: string) => {
    setSelectedExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const onSubmit = async (data: BookingFormValues) => {
    setServerError(null);
    try {
      const payload = { ...data, selectedExtras, couponCode: couponApplied?.code ?? (couponCode.trim() || undefined) };
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        setServerError(result.error ?? "Booking failed. Please try again.");
        return;
      }
      router.push(`/booking/confirm?ref=${result.bookingRef}`);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  };

  const primaryImage = car.images.find(i => i.isPrimary) ?? car.images[0];

  const FormField = ({ id, label, error, required = true, ...props }: any) => (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-crimson-500 ml-0.5">*</span>}
      </label>
      <input id={id} {...props} className={cn("form-input", error ? "border-red-400 bg-red-50" : "")} />
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />{error}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-navy-900 py-10">
        <div className="page-container">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Link href="/fleet" className="hover:text-white transition-colors">{t.nav.fleet}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/fleet/${car.slug}`} className="hover:text-white transition-colors">{car.name}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">{t.booking.title}</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white">{t.booking.title}</h1>
          <p className="text-gray-400 mt-1">{locale === "al" ? "Shqyrtoni zgjedhjen tuaj dhe vendosni detajet tuaja më poshtë" : "Review your selection and enter your details below"}</p>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          {/* Main form — appears second on mobile, first on lg */}
          <div className="lg:col-span-2 order-last lg:order-first">
            {!isLoggedIn && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-800">{locale === "al" ? "Keni llogari?" : "Have an account?"}</p>
                  <p className="text-blue-700 mt-0.5">
                    <Link href={`/login?callbackUrl=/booking?carId=${car.id}&pickupLocationId=${pickupLocation.id}&pickupDate=${pickupDate}&pickupTime=${pickupTime}&returnDate=${returnDate}&returnTime=${returnTime}`} className="underline font-medium">{t.auth.loginButton}</Link>{" "}
                    {locale === "al" ? "për të plotësuar automatikisht detajet tuaja dhe ruajtur këtë rezervim." : "to autofill your details and save this booking to your account."}
                  </p>
                </div>
              </div>
            )}

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Hidden fields */}
              <input type="hidden" {...register("carId")} />
              <input type="hidden" {...register("pickupLocationId")} />
              <input type="hidden" {...register("dropoffLocationId")} />
              <input type="hidden" {...register("pickupDate")} />
              <input type="hidden" {...register("pickupTime")} />
              <input type="hidden" {...register("returnDate")} />
              <input type="hidden" {...register("returnTime")} />

              {/* Personal details */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-8 w-8 bg-navy-900 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="font-bold text-navy-900">{t.booking.personalInfo}</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    id="firstName"
                    label={t.booking.firstName}
                    type="text"
                    autoComplete="given-name"
                    placeholder="John"
                    error={errors.firstName?.message}
                    {...register("firstName")}
                  />
                  <FormField
                    id="lastName"
                    label={t.booking.lastName}
                    type="text"
                    autoComplete="family-name"
                    placeholder="Doe"
                    error={errors.lastName?.message}
                    {...register("lastName")}
                  />
                  <FormField
                    id="email"
                    label={t.booking.email}
                    type="email"
                    autoComplete="email"
                    placeholder="john@example.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      {t.booking.phone}<span className="text-crimson-500 ml-0.5">*</span>
                    </label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          id="phone"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          error={errors.phone?.message}
                        />
                      )}
                    />
                  </div>
                  <FormField
                    id="idNumber"
                    label={t.booking.idNumber}
                    type="text"
                    placeholder="AB123456"
                    error={errors.idNumber?.message}
                    {...register("idNumber")}
                  />
                  <FormField
                    id="licenseNumber"
                    label={t.booking.licenseNumber}
                    type="text"
                    placeholder="KS-123456"
                    error={errors.licenseNumber?.message}
                    {...register("licenseNumber")}
                  />
                  <div>
                    <label htmlFor="nationality" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      {t.booking.nationality}
                    </label>
                    <Controller
                      name="nationality"
                      control={control}
                      render={({ field }) => (
                        <CountrySelect
                          id="nationality"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder={locale === "al" ? "Zgjidh shtetësinë" : "Select nationality"}
                          valueType="nationality"
                          error={errors.nationality?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 bg-navy-900 rounded-lg flex items-center justify-center">
                    <Tag className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="font-bold text-navy-900">{t.booking.couponCode}</h2>
                </div>
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">{locale === "al" ? "Kodi" : "Code"} <span className="font-mono">{couponApplied.code}</span> {locale === "al" ? "u aplikua" : "applied"}</p>
                        <p className="text-xs text-green-600">{couponApplied.description} — {locale === "al" ? "kursen" : "saves"} {formatCurrency(couponApplied.discount)}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setCouponApplied(null); setCouponCode(""); }} className="text-xs text-red-500 hover:underline font-medium ml-2">{locale === "al" ? "Hiq" : "Remove"}</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2 max-w-sm">
                      <input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); validateCoupon(); } }}
                        className="form-input flex-1 font-mono"
                        placeholder={locale === "al" ? "Vendos kodin promo" : "Enter promo code"}
                      />
                      <button
                        type="button"
                        onClick={validateCoupon}
                        disabled={!couponCode.trim() || couponLoading}
                        className="px-4 py-2 bg-navy-900 hover:bg-navy-800 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                      >
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.booking.apply}
                      </button>
                    </div>
                    {couponError && (
                      <div className="flex items-start gap-1.5 text-sm text-red-600">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{couponError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Extras */}
              {allExtras.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="h-8 w-8 bg-navy-900 rounded-lg flex items-center justify-center">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="font-bold text-navy-900">{t.booking.extras}</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {allExtras.map((extra) => (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => toggleExtra(extra.id)}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                          selectedExtras.includes(extra.id) ? "border-navy-900 bg-navy-50" : "border-gray-100 hover:border-navy-200"
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

              {/* Special requests */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <h2 className="font-bold text-navy-900 mb-3">{t.booking.specialRequests}</h2>
                <textarea
                  {...register("specialRequests")}
                  rows={3}
                  placeholder={locale === "al" ? "Kërkesa të veçanta, madhësi karrige fëmijësh, numër fluturimi për marrje aeroporti, etj." : "Any special requirements, child seat size, flight number for airport pickup, etc."}
                  className="form-input resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{locale === "al" ? "Opsionale — do të bëjmë çmos për t'i akomoduar kërkesat tuaja." : "Optional — we will do our best to accommodate your requests."}</p>
              </div>

              {/* Terms */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <h2 className="font-bold text-navy-900 mb-4">{locale === "al" ? "Marrëveshjet" : "Agreements"}</h2>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" {...register("acceptTerms")} className="h-4 w-4 mt-0.5 rounded border-gray-300 text-navy-900 cursor-pointer" />
                    <span className="text-sm text-gray-700">
                      {locale === "al" ? "Kam lexuar dhe pranoj " : "I have read and accept the "}
                      <Link href="/terms" target="_blank" className="text-navy-900 underline font-medium">{t.footer.terms}</Link>
                      {locale === "al" ? " dhe " : " and "}
                      <Link href="/rental-policy" target="_blank" className="text-navy-900 underline font-medium">{t.footer.rentalPolicy}</Link>.
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-xs text-red-500 flex items-center gap-1 ml-7">
                      <AlertCircle className="h-3 w-3" />{errors.acceptTerms.message}
                    </p>
                  )}

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" {...register("acceptCancellation")} className="h-4 w-4 mt-0.5 rounded border-gray-300 text-navy-900 cursor-pointer" />
                    <span className="text-sm text-gray-700">
                      {locale === "al" ? "Pranoj " : "I accept the "}
                      <Link href="/rental-policy#cancellation" target="_blank" className="text-navy-900 underline font-medium">{locale === "al" ? "Politikën e Anulimit & Depozitës" : "Cancellation & Deposit Policy"}</Link>.
                    </span>
                  </label>
                  {errors.acceptCancellation && (
                    <p className="text-xs text-red-500 flex items-center gap-1 ml-7">
                      <AlertCircle className="h-3 w-3" />{errors.acceptCancellation.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-4 text-base"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> {t.booking.processing}</>
                ) : (
                  <>{t.booking.confirmBooking} — {formatCurrency(total)}</>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                {locale === "al" ? "Asnjë pagesë e nevojshme tani. Makina juaj rezervohet menjëherë." : "No payment required now. Your car is reserved instantly."}
              </p>
            </form>
          </div>

          {/* Summary sidebar — appears first on mobile, last on lg */}
          <div className="order-first lg:order-last">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h3 className="font-bold text-navy-900 mb-4">{locale === "al" ? "Përmbledhje e Rezervimit" : "Booking Summary"}</h3>

              {/* Car */}
              <div className="flex gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="relative h-16 w-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {primaryImage?.url && !imageFailed ? (
                    <Image src={primaryImage.url} alt={car.name} fill className="object-cover" sizes="96px" onError={() => setImageFailed(true)} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-crimson-500 font-semibold">{car.category.name}</p>
                  <p className="font-bold text-navy-900 text-sm">{car.name}</p>
                  <p className="text-xs text-gray-500">{car.year} · {car.transmission === "AUTOMATIC" ? (locale === "al" ? "Automatik" : "Auto") : (locale === "al" ? "Manual" : "Manual")}</p>
                </div>
              </div>

              {/* Trip details */}
              <div className="space-y-2.5 mb-4 pb-4 border-b border-gray-100 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-navy-900">{t.confirm.pickup}</p>
                    <p className="text-gray-600 text-xs">{pickupLocation.name}</p>
                    <p className="text-gray-500 text-xs">{pickupDate} {locale === "al" ? "në" : "at"} {pickupTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-navy-900">{t.confirm.dropoff}</p>
                    <p className="text-gray-600 text-xs">{dropoffLocation.name}</p>
                    <p className="text-gray-500 text-xs">{returnDate} {locale === "al" ? "në" : "at"} {returnTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                  <p className="text-gray-700">
                    <span className="font-semibold">{durationDays} {durationDays !== 1 ? t.booking.days : t.booking.day}</span> {locale === "al" ? "gjithsej" : "total rental"}
                  </p>
                </div>
              </div>

              {/* Selected extras */}
              {selectedExtras.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{locale === "al" ? "Shtesa të Zgjedhura" : "Selected Extras"}</p>
                  {selectedExtras.map(id => {
                    const extra = allExtras.find(e => e.id === id);
                    if (!extra) return null;
                    const extraCost = extra.pricingType === "PER_DAY" ? extra.price * durationDays : extra.price;
                    return (
                      <div key={id} className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{extra.name}</span>
                        <span>{formatCurrency(extraCost)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{formatCurrency(effectivePricePerDay)}{t.booking.perDay} × {durationDays}{locale === "al" ? "d" : "d"}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {extrasTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t.booking.extrasTotal}</span>
                    <span>{formatCurrency(extrasTotal)}</span>
                  </div>
                )}
                {pickupFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t.booking.pickupFee}</span>
                    <span>{formatCurrency(pickupFee)}</span>
                  </div>
                )}
                {dropoffFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t.booking.dropoffFee}</span>
                    <span>{formatCurrency(dropoffFee)}</span>
                  </div>
                )}
                {couponApplied && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>{t.booking.discount} ({couponApplied.code})</span>
                    <span>-{formatCurrency(couponApplied.discount)}</span>
                  </div>
                )}
                {vatAmount > 0 && (
                  <>
                    <div className="flex justify-between text-gray-500 border-t border-gray-100 pt-2">
                      <span>{t.payment.subtotalExclVat}</span>
                      <span>{formatCurrency(preTaxTotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>{t.payment.vatRate}</span>
                      <span>{formatCurrency(vatAmount)}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-navy-900 text-base">
                  <span>{t.payment.totalInclVat}</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>{t.payment.depositPreAuth}</span>
                  <span>{formatCurrency(car.deposit)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 font-medium">✓ {locale === "al" ? "Anulim i lirë deri 48 orë para marrjes" : "Free cancellation up to 48 hours before pickup"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
