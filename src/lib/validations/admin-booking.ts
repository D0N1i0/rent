import { z } from "zod";

// Admin booking schema — no acceptTerms/acceptCancellation, no 2-hour lead enforcement.
// Admins can create bookings for walk-in customers and past/same-day pickups.
export const adminBookingSchema = z.object({
  carId: z.string().min(1, "Please select a vehicle"),
  pickupLocationId: z.string().min(1, "Please select a pickup location"),
  dropoffLocationId: z.string().min(1, "Please select a drop-off location"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTime: z.string().min(1, "Pickup time is required").regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  returnDate: z.string().min(1, "Return date is required"),
  returnTime: z.string().min(1, "Return time is required").regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  // Link to existing user (optional)
  userId: z.string().optional().or(z.literal("")),
  // Customer snapshot
  firstName: z.string().min(2).max(50).refine((v) => v.trim().length >= 2, "First name cannot be blank"),
  lastName: z.string().min(2).max(50).refine((v) => v.trim().length >= 2, "Last name cannot be blank"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7).max(25).regex(/^\+?\d[\d\s\-\(\)]{5,}$/, "Invalid phone number format"),
  idNumber: z.string().min(3).max(50),
  licenseNumber: z.string().min(3).max(50),
  nationality: z.string().max(80).optional().or(z.literal("")),
  // Extras & coupon
  selectedExtras: z.array(z.string()).default([]),
  couponCode: z.string().max(50).optional().or(z.literal("")),
  specialRequests: z.string().max(500).optional().or(z.literal("")),
  internalNotes: z.string().max(2000).optional().or(z.literal("")),
  // Admin options
  status: z.enum(["PENDING", "CONFIRMED"]).default("PENDING"),
  sendConfirmationEmail: z.boolean().default(false),
});

export type AdminBookingFormValues = z.infer<typeof adminBookingSchema>;

// Preview schema — subset used by the price-preview endpoint
export const adminBookingPreviewSchema = z.object({
  carId: z.string().min(1),
  pickupLocationId: z.string().min(1),
  dropoffLocationId: z.string().min(1),
  pickupDate: z.string().min(1),
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/),
  returnDate: z.string().min(1),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/),
  selectedExtras: z.array(z.string()).default([]),
  couponCode: z.string().max(50).optional().or(z.literal("")),
});
