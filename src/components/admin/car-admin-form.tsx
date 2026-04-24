"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { carSchema, type CarFormValues } from "@/lib/validations/booking";
import { Loader2, Save, AlertCircle, Plus, X, Image as ImageIcon } from "lucide-react";
import type { CarCategory, Car, CarImage } from "@prisma/client";
import { cn } from "@/lib/utils";

type CarWithImages = Car & { images: CarImage[] };

interface CarAdminFormProps {
  categories: CarCategory[];
  car?: CarWithImages;
}

export function CarAdminForm({ categories, car }: CarAdminFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>(car?.features ?? []);
  const [imageInput, setImageInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>(car?.images.map((image) => image.url) ?? []);

  const defaultValues: CarFormValues = car
    ? {
        name: car.name,
        brand: car.brand,
        model: car.model,
        year: car.year,
        vin: car.vin ?? "",
        licensePlate: car.licensePlate ?? "",
        categoryId: car.categoryId,
        transmission: car.transmission,
        fuelType: car.fuelType,
        seats: car.seats,
        doors: car.doors,
        luggageSmall: car.luggageSmall,
        luggageLarge: car.luggageLarge,
        hasAC: car.hasAC,
        hasBluetooth: car.hasBluetooth,
        hasGPS: car.hasGPS,
        hasUSB: car.hasUSB,
        mileageLimit: car.mileageLimit ?? undefined,
        extraKmFee: car.extraKmFee != null ? Number(car.extraKmFee) : undefined,
        fuelPolicy: car.fuelPolicy ?? "",
        minAge: car.minAge,
        licenseYears: car.licenseYears,
        pricePerDay: Number(car.pricePerDay),
        pricePerWeek: car.pricePerWeek != null ? Number(car.pricePerWeek) : undefined,
        pricePerMonth: car.pricePerMonth != null ? Number(car.pricePerMonth) : undefined,
        deposit: Number(car.deposit),
        description: car.description ?? "",
        shortDescription: car.shortDescription ?? "",
        isActive: car.isActive,
        isFeatured: car.isFeatured,
        metaTitle: car.metaTitle ?? "",
        metaDescription: car.metaDescription ?? "",
        features: car.features,
        imageUrls: car.images.map((image) => image.url),
      }
    : {
        hasAC: true,
        hasBluetooth: false,
        hasGPS: false,
        hasUSB: true,
        seats: 5,
        doors: 5,
        luggageSmall: 1,
        luggageLarge: 1,
        minAge: 21,
        licenseYears: 1,
        deposit: 200,
        year: new Date().getFullYear(),
        transmission: "MANUAL",
        fuelType: "PETROL",
        isActive: true,
        isFeatured: false,
        features: [],
        imageUrls: [],
        name: "",
        brand: "",
        model: "",
        vin: "",
        licensePlate: "",
        categoryId: "",
        pricePerDay: 0,
      };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues,
  });

  const imagePreviewUrls = useMemo(() => imageUrls.filter(Boolean), [imageUrls]);

  const addFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      const updated = [...features, featureInput.trim()];
      setFeatures(updated);
      setValue("features", updated);
      setFeatureInput("");
    }
  };

  const removeFeature = (f: string) => {
    const updated = features.filter((x) => x !== f);
    setFeatures(updated);
    setValue("features", updated);
  };

  const addImageUrl = () => {
    const trimmed = imageInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      setServerError("Please enter a valid image URL starting with http:// or https://");
      return;
    }
    if (imageUrls.includes(trimmed)) {
      setServerError("That image URL has already been added.");
      return;
    }
    const updated = [...imageUrls, trimmed];
    setImageUrls(updated);
    setValue("imageUrls", updated, { shouldValidate: true });
    setImageInput("");
    setServerError(null);
  };

  const removeImageUrl = (url: string) => {
    const updated = imageUrls.filter((item) => item !== url);
    setImageUrls(updated);
    setValue("imageUrls", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: CarFormValues) => {
    setServerError(null);
    const payload = { ...data, features, imageUrls };
    const url = car ? `/api/admin/cars/${car.id}` : "/api/admin/cars";
    const method = car ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        setServerError(result.error ?? "Failed to save car");
        return;
      }
      router.push("/admin/cars");
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    }
  };

  const F = ({
    id,
    label,
    error,
    required = false,
    children,
  }: {
    id?: string;
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="text-crimson-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );

  const Input = ({
    id,
    error,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { error?: { message?: string } | string | boolean }) => (
    <input id={id} {...props} className={cn("form-input", !!error && "border-red-400")} />
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
      <h3 className="font-bold text-navy-900 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Basic Information">
            <div className="grid sm:grid-cols-2 gap-4">
              <F id="name" label="Car Name" required error={errors.name?.message}>
                <Input id="name" type="text" error={errors.name} {...register("name")} placeholder="e.g. Toyota RAV4" />
              </F>
              <F id="brand" label="Brand" required error={errors.brand?.message}>
                <Input id="brand" type="text" error={errors.brand} {...register("brand")} />
              </F>
              <F id="model" label="Model" required error={errors.model?.message}>
                <Input id="model" type="text" error={errors.model} {...register("model")} />
              </F>
              <F id="year" label="Year" required error={errors.year?.message}>
                <Input id="year" type="number" min={2000} max={2030} error={errors.year} {...register("year", { valueAsNumber: true })} />
              </F>
              <F id="vin" label="VIN (Vehicle ID Number)" error={errors.vin?.message}>
                <Input id="vin" type="text" maxLength={17} placeholder="e.g. 1HGBH41JXMN109186" error={errors.vin} {...register("vin")} />
              </F>
              <F id="licensePlate" label="Licence Plate" error={errors.licensePlate?.message}>
                <Input id="licensePlate" type="text" maxLength={20} placeholder="e.g. ABC-1234" error={errors.licensePlate} {...register("licensePlate")} />
              </F>
              <F id="categoryId" label="Category" required error={errors.categoryId?.message}>
                <select id="categoryId" {...register("categoryId")} className={cn("form-input appearance-none", errors.categoryId && "border-red-400")}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </F>
              <F id="transmission" label="Transmission" required error={errors.transmission?.message}>
                <select id="transmission" {...register("transmission")} className="form-input appearance-none">
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATIC">Automatic</option>
                </select>
              </F>
              <F id="fuelType" label="Fuel Type" required error={errors.fuelType?.message}>
                <select id="fuelType" {...register("fuelType")} className="form-input appearance-none">
                  <option value="PETROL">Petrol</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="ELECTRIC">Electric</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </F>
            </div>
          </Section>

          <Section title="Specifications">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              <F id="seats" label="Seats" required error={errors.seats?.message}>
                <Input id="seats" type="number" min={1} max={20} error={errors.seats} {...register("seats", { valueAsNumber: true })} />
              </F>
              <F id="doors" label="Doors" error={errors.doors?.message}>
                <Input id="doors" type="number" min={2} max={6} error={errors.doors} {...register("doors", { valueAsNumber: true })} />
              </F>
              <F id="luggageLarge" label="Large Bags" error={errors.luggageLarge?.message}>
                <Input id="luggageLarge" type="number" min={0} max={20} error={errors.luggageLarge} {...register("luggageLarge", { valueAsNumber: true })} />
              </F>
              <F id="luggageSmall" label="Small Bags" error={errors.luggageSmall?.message}>
                <Input id="luggageSmall" type="number" min={0} max={20} error={errors.luggageSmall} {...register("luggageSmall", { valueAsNumber: true })} />
              </F>
              <F id="minAge" label="Min Age" required error={errors.minAge?.message}>
                <Input id="minAge" type="number" min={18} max={30} error={errors.minAge} {...register("minAge", { valueAsNumber: true })} />
              </F>
              <F id="licenseYears" label="Licence Years" required error={errors.licenseYears?.message}>
                <Input id="licenseYears" type="number" min={1} max={10} error={errors.licenseYears} {...register("licenseYears", { valueAsNumber: true })} />
              </F>
              <F id="mileageLimit" label="KM/Day (0=∞)" error={errors.mileageLimit?.message}>
                <Input id="mileageLimit" type="number" min={0} placeholder="0" error={errors.mileageLimit} {...register("mileageLimit", { setValueAs: (v) => (v === "" ? null : Number(v)) })} />
              </F>
              <F id="extraKmFee" label="Extra KM Fee €" error={errors.extraKmFee?.message}>
                <Input id="extraKmFee" type="number" min={0} step={0.01} placeholder="0.15" error={errors.extraKmFee} {...register("extraKmFee", { setValueAs: (v) => (v === "" ? null : Number(v)) })} />
              </F>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Features</p>
              <div className="flex gap-2 mb-2">
                <input type="text" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())} placeholder="e.g. Bluetooth, GPS" className="form-input flex-1 text-sm" />
                <button type="button" onClick={addFeature} className="btn-secondary text-sm px-3 py-2"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <span key={f} className="flex items-center gap-1.5 bg-navy-100 text-navy-800 text-xs font-medium px-3 py-1.5 rounded-full">
                    {f}
                    <button type="button" onClick={() => removeFeature(f)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-4 gap-3">
              {[
                { id: "hasAC" as const, label: "Air Con" },
                { id: "hasBluetooth" as const, label: "Bluetooth" },
                { id: "hasGPS" as const, label: "GPS" },
                { id: "hasUSB" as const, label: "USB" },
              ].map(({ id, label }) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                  <input type="checkbox" {...register(id)} className="h-4 w-4 rounded border-gray-300 text-navy-900" />
                  {label}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Pricing">
            <div className="grid sm:grid-cols-4 gap-4">
              <F id="pricePerDay" label="Daily Rate €" required error={errors.pricePerDay?.message}>
                <Input id="pricePerDay" type="number" min={0} step={1} error={errors.pricePerDay} {...register("pricePerDay", { valueAsNumber: true })} />
              </F>
              <F id="pricePerWeek" label="Weekly Rate €" error={errors.pricePerWeek?.message}>
                <Input id="pricePerWeek" type="number" min={0} step={1} placeholder="Optional" error={errors.pricePerWeek} {...register("pricePerWeek", { setValueAs: (v) => (v === "" ? null : Number(v)) })} />
              </F>
              <F id="pricePerMonth" label="Monthly Rate €" error={errors.pricePerMonth?.message}>
                <Input id="pricePerMonth" type="number" min={0} step={1} placeholder="Optional" error={errors.pricePerMonth} {...register("pricePerMonth", { setValueAs: (v) => (v === "" ? null : Number(v)) })} />
              </F>
              <F id="deposit" label="Deposit €" required error={errors.deposit?.message}>
                <Input id="deposit" type="number" min={0} step={10} error={errors.deposit} {...register("deposit", { valueAsNumber: true })} />
              </F>
            </div>
          </Section>

          <Section title="Vehicle Images">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Add one or more image URLs. The first image will be used as the primary cover photo.</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
                  placeholder="https://example.com/car-image.jpg"
                  className="form-input flex-1"
                />
                <button type="button" onClick={addImageUrl} className="btn-secondary px-4 py-2">
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              {errors.imageUrls?.message && (
                <p className="text-xs text-red-500 mt-1">{errors.imageUrls.message as string}</p>
              )}
              {imagePreviewUrls.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={url} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                      <div className="aspect-[16/10] bg-white rounded-lg overflow-hidden border border-gray-200 mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Vehicle image ${index + 1}`} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{index === 0 ? "Primary image" : `Image ${index + 1}`}</p>
                          <p className="text-xs text-gray-500 break-all">{url}</p>
                        </div>
                        <button type="button" onClick={() => removeImageUrl(url)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
                  <ImageIcon className="h-5 w-5 mx-auto mb-2 text-gray-300" />
                  No images added yet.
                </div>
              )}
            </div>
          </Section>

          <Section title="Description">
            <div className="space-y-4">
              <F id="shortDescription" label="Short Description (card preview)" error={errors.shortDescription?.message}>
                <Input id="shortDescription" type="text" maxLength={200} placeholder="1-2 sentence teaser" error={errors.shortDescription} {...register("shortDescription")} />
              </F>
              <F id="description" label="Full Description" error={errors.description?.message}>
                <textarea id="description" {...register("description")} rows={5} className={cn("form-input resize-y", errors.description && "border-red-400")} placeholder="Detailed description shown on car detail page..." />
              </F>
              <F id="fuelPolicy" label="Fuel Policy" error={errors.fuelPolicy?.message}>
                <Input id="fuelPolicy" type="text" placeholder="Full to Full" error={errors.fuelPolicy} {...register("fuelPolicy")} />
              </F>
            </div>
          </Section>

          <Section title="SEO (Optional)">
            <div className="space-y-4">
              <F id="metaTitle" label="Meta Title (max 60 chars)" error={errors.metaTitle?.message}>
                <Input id="metaTitle" type="text" maxLength={60} error={errors.metaTitle} {...register("metaTitle")} />
              </F>
              <F id="metaDescription" label="Meta Description (max 160 chars)" error={errors.metaDescription?.message}>
                <textarea id="metaDescription" {...register("metaDescription")} rows={2} maxLength={160} className="form-input resize-none" />
              </F>
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-navy-900 mb-4">Status</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("isActive")} className="h-4 w-4 rounded border-gray-300 text-navy-900" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Active</p>
                  <p className="text-xs text-gray-400">Visible in fleet listing</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("isFeatured")} className="h-4 w-4 rounded border-gray-300 text-navy-900" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Featured</p>
                  <p className="text-xs text-gray-400">Shown on homepage</p>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5 text-base">
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-5 w-5" /> {car ? "Update Car" : "Create Car"}</>
            )}
          </button>

          <button type="button" onClick={() => router.push("/admin/cars")} className="btn-outline w-full py-3 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
