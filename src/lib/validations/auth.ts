// src/lib/validations/auth.ts
import { z } from "zod";
import { optionalPhoneSchema } from "@/lib/validations/phone";

// ─── Shared field validators ──────────────────────────────────────────────────

/** DOB: must be at least 18 years ago from now. */
function isAtLeast18(dateStr: string): boolean {
  const dob = new Date(dateStr);
  if (isNaN(dob.getTime())) return false;
  const today = new Date();
  const cutoff = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return dob <= cutoff;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
    lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    phone: optionalPhoneSchema,
    nationality: z.string().max(80).optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100)
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100)
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100)
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const profileSchema = z.object({
  firstName: z.string().min(2, "At least 2 characters").max(50),
  lastName: z.string().min(2, "At least 2 characters").max(50),
  phone: optionalPhoneSchema,
  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || isAtLeast18(v),
      "You must be at least 18 years old"
    ),
  nationality: z.string().max(80).optional().or(z.literal("")),
  idNumber: z.string().max(50).optional().or(z.literal("")),
  licenseNumber: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  saveProfileData: z.boolean(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

/** Admin edit schema — same as profile but all optional + extra admin fields. */
export const adminUserEditSchema = z.object({
  firstName: z.string().min(2).max(50).optional().or(z.literal("")),
  lastName: z.string().min(2).max(50).optional().or(z.literal("")),
  phone: optionalPhoneSchema,
  dateOfBirth: z.string().optional().or(z.literal("")),
  nationality: z.string().max(80).optional().or(z.literal("")),
  idNumber: z.string().max(50).optional().or(z.literal("")),
  licenseNumber: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
export type AdminUserEditValues = z.infer<typeof adminUserEditSchema>;

export { isAtLeast18 };
