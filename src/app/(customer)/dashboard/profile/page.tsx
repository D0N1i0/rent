// src/app/(customer)/dashboard/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { profileSchema, type ProfileValues } from "@/lib/validations/auth";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelect } from "@/components/ui/country-select";
import { CityInput } from "@/components/ui/city-input";
import { Save, Loader2, CheckCircle, AlertCircle, User, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useT, useLanguage } from "@/lib/i18n/context";

/** Format date string to human-readable (e.g. "15 April 1990"). */
function formatDOBDisplay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

/** Max date for DOB picker: exactly 18 years ago today. */
function maxDOBDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const t = useT();
  const { locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { saveProfileData: true, phone: "", nationality: "", country: "", city: "" },
  });

  const watchedCountry = watch("country");

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          reset({
            firstName: data.user.firstName ?? "",
            lastName: data.user.lastName ?? "",
            phone: data.user.phone ?? "",
            dateOfBirth: data.user.dateOfBirth
              ? new Date(data.user.dateOfBirth).toISOString().split("T")[0]
              : "",
            nationality: data.user.nationality ?? "",
            idNumber: data.user.idNumber ?? "",
            licenseNumber: data.user.licenseNumber ?? "",
            address: data.user.address ?? "",
            city: data.user.city ?? "",
            country: data.user.country ?? "",
            saveProfileData: data.user.saveProfileData ?? true,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [session, reset]);

  const onSubmit = async (data: ProfileValues) => {
    setSaving(true);
    setStatus("idle");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setErrorMsg(result.error ?? t.common.errorOccurred);
        setStatus("error");
        return;
      }
      setStatus("success");
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setErrorMsg(t.common.errorOccurred);
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const FieldLabel = ({ htmlFor, label, required = false }: { htmlFor: string; label: string; required?: boolean }) => (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
      {label}{required && <span className="text-crimson-500 ml-0.5">*</span>}
    </label>
  );

  const TextField = ({
    id, label, required = false, error, ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; required?: boolean; error?: string }) => (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <input id={id} {...props} className={cn("form-input", error && "border-red-400")} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy-900" />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 mb-3 transition-colors">
            <ChevronLeft className="h-4 w-4" /> {locale === "al" ? "Kthehu te Paneli" : "Back to Dashboard"}
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900 flex items-center gap-3">
            <User className="h-7 w-7 text-gray-400" /> {t.profile.title}
          </h1>
          <p className="text-gray-500 mt-1">{locale === "al" ? "Mbani të dhënat tuaja të përditësuara për rezervime më të shpejta" : "Keep your details up to date for faster bookings"}</p>
        </div>
      </div>

      <div className="page-container py-8 max-w-2xl mx-auto">
        {status === "error" && errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}
        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-700">{t.profile.saveSuccess}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Personal information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-navy-900 mb-5">{t.profile.personalInfo}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField id="firstName" label={t.auth.firstNameLabel} required type="text" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
              <TextField id="lastName" label={t.auth.lastNameLabel} required type="text" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />

              {/* Phone input with country code */}
              <div>
                <FieldLabel htmlFor="phone" label={t.auth.phoneLabel} />
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

              {/* Date of Birth */}
              <div>
                <FieldLabel htmlFor="dateOfBirth" label={`${t.profile.dateOfBirth} (18+ required)`} />
                <input
                  id="dateOfBirth"
                  type="date"
                  max={maxDOBDate()}
                  className={cn("form-input", errors.dateOfBirth && "border-red-400")}
                  {...register("dateOfBirth")}
                />
                {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth.message}</p>}
                {!errors.dateOfBirth && watch("dateOfBirth") && (
                  <p className="text-xs text-gray-500 mt-1">{formatDOBDisplay(watch("dateOfBirth") as string)}</p>
                )}
              </div>

              {/* Nationality dropdown */}
              <div>
                <FieldLabel htmlFor="nationality" label={t.auth.nationalityLabel} />
                <Controller
                  name="nationality"
                  control={control}
                  render={({ field }) => (
                    <CountrySelect
                      id="nationality"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Select nationality"
                      valueType="nationality"
                      error={errors.nationality?.message}
                    />
                  )}
                />
              </div>

              {/* Country of Residence dropdown */}
              <div>
                <FieldLabel htmlFor="country" label={t.profile.country} />
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <CountrySelect
                      id="country"
                      value={field.value ?? ""}
                      onChange={(v) => {
                        field.onChange(v);
                      }}
                      placeholder="Select country"
                      valueType="name"
                      error={errors.country?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-navy-900 mb-1">{t.profile.drivingInfo}</h2>
            <p className="text-sm text-gray-500 mb-4">{locale === "al" ? "Kërkohet kur merrni makinën. Shtojini tani për të shpejtuar procesin." : "Required when you pick up the car. Add them now to speed up the process."}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField id="idNumber" label={t.profile.idNumber} type="text" error={errors.idNumber?.message} {...register("idNumber")} />
              <TextField id="licenseNumber" label={t.profile.licenseNumber} type="text" error={errors.licenseNumber?.message} {...register("licenseNumber")} />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-navy-900 mb-4">{t.profile.address}</h2>
            <div className="space-y-4">
              <TextField id="address" label={t.profile.address} type="text" autoComplete="street-address" error={errors.address?.message} {...register("address")} />
              {/* City depends on selected country */}
              <div>
                <FieldLabel htmlFor="city" label={t.profile.city} />
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <CityInput
                      id="city"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      country={watchedCountry ?? ""}
                      error={errors.city?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Save preference */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" {...register("saveProfileData")} className="h-4 w-4 mt-0.5 rounded border-gray-300 text-navy-900" />
              <div>
                <p className="font-semibold text-sm text-navy-900">{t.profile.saveProfileData}</p>
                <p className="text-xs text-gray-500 mt-0.5">{locale === "al" ? "Të dhënat tuaja do të plotësohen paraprakisht në formularin e rezervimit." : "Your details will be pre-filled in the booking form to save you time."}</p>
              </div>
            </label>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full py-3.5 text-base">
            {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> {t.profile.saving}</> : <><Save className="h-5 w-5" /> {t.profile.saveChanges}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
