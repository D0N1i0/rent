// src/lib/validations/booking.ts
import { z } from "zod";
import { buildBookingDateTimes, validateBookingWindow } from "@/lib/booking-rules";
import { isValidPhone } from "@/lib/phone";

export const bookingSchema = z
  .object({
    carId: z.string().min(1, "Please select a vehicle"),
    pickupLocationId: z.string().min(1, "Please select a pickup location"),
    dropoffLocationId: z.string().min(1, "Please select a drop-off location"),
    pickupDate: z.string().min(1, "Pickup date is required"),
    pickupTime: z.string().min(1, "Pickup time is required").regex(/^\d{2}:\d{2}$/, "Invalid time format"),
    returnDate: z.string().min(1, "Return date is required"),
    returnTime: z.string().min(1, "Return time is required").regex(/^\d{2}:\d{2}$/, "Invalid time format"),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50)
      .refine((v) => v.trim().length >= 2, "First name cannot be blank"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50)
      .refine((v) => v.trim().length >= 2, "Last name cannot be blank"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .min(7, "Phone number must be at least 7 characters")
      .max(25)
      .refine((v) => isValidPhone(v), "Enter a valid phone number with country code (e.g. +383 44 123 456)"),
    idNumber: z.string().min(3, "ID/Passport number is required").max(50),
    licenseNumber: z.string().min(3, "Driving licence number is required").max(50),
    nationality: z.string().max(80).optional().or(z.literal("")),
    selectedExtras: z.array(z.string()).default([]),
    specialRequests: z.string().max(500).optional().or(z.literal("")),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the rental terms and conditions",
    }),
    acceptCancellation: z.boolean().refine((val) => val === true, {
      message: "You must accept the cancellation policy",
    }),
  })
  .superRefine((data, ctx) => {
    const { pickupDT, returnDT } = buildBookingDateTimes({
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      returnDate: data.returnDate,
      returnTime: data.returnTime,
    });

    const bookingWindowError = validateBookingWindow(pickupDT, returnDT);
    if (bookingWindowError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: bookingWindowError,
        path: bookingWindowError.toLowerCase().includes("return") ? ["returnDate"] : ["pickupDate"],
      });
    }
  });

export type BookingFormValues = z.infer<typeof bookingSchema>;

export const carSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  brand: z.string().min(1, "Brand is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.number().int().min(2000).max(new Date().getFullYear() + 2),
  licensePlate: z.string().max(20).optional().or(z.literal("")).transform(v => v?.trim() || undefined),
  vin: z.string().max(17).optional().or(z.literal("")).transform(v => v?.trim() || undefined),
  categoryId: z.string().min(1, "Category is required"),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID"]),
  seats: z.number().int().min(1).max(20),
  doors: z.number().int().min(2).max(6).default(4),
  luggageSmall: z.number().int().min(0).max(20).default(1),
  luggageLarge: z.number().int().min(0).max(20).default(1),
  hasAC: z.boolean().default(true),
  hasBluetooth: z.boolean().default(false),
  hasGPS: z.boolean().default(false),
  hasUSB: z.boolean().default(false),
  mileageLimit: z.number().int().min(0).nullable().optional(),
  extraKmFee: z.number().min(0).nullable().optional(),
  fuelPolicy: z.string().max(100).optional().or(z.literal("")),
  minAge: z.number().int().min(18).max(35).default(21),
  licenseYears: z.number().int().min(1).max(10).default(1),
  pricePerDay: z.number().positive("Daily price must be greater than 0"),
  pricePerWeek: z.number().positive().nullable().optional(),
  pricePerMonth: z.number().positive().nullable().optional(),
  deposit: z.number().min(0).default(200),
  description: z.string().max(3000).optional().or(z.literal("")),
  shortDescription: z.string().max(250).optional().or(z.literal("")),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().max(60).optional().or(z.literal("")),
  metaDescription: z.string().max(160).optional().or(z.literal("")),
  imageUrls: z.array(z.string().url("Each image must be a valid URL")).max(12).default([]),
});
export type CarFormValues = z.infer<typeof carSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20).optional().or(z.literal("")),
  subject: z.string().max(200).optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});
export type ContactFormValues = z.infer<typeof contactSchema>;
