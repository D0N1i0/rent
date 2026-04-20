// src/components/admin/user-detail-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Save, Loader2, User, Calendar, Car,
  CheckCircle, AlertCircle, FileText, Phone, MapPin, Trash2, X,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { adminUserEditSchema, type AdminUserEditValues } from "@/lib/validations/auth";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelect } from "@/components/ui/country-select";
import { CityInput } from "@/components/ui/city-input";
import { cn } from "@/lib/utils";

/**
 * Handles legacy nationality format "us United States" → "United States"
 * New entries store just the adjective "American", so pass those through unchanged.
 */
function formatNationality(value: string | null | undefined): string {
  if (!value) return "—";
  // Legacy format: two lowercase letters then a space then the country name
  const legacyMatch = value.match(/^[a-z]{2}\s+(.+)$/);
  if (legacyMatch) return legacyMatch[1];
  return value;
}

interface UserDetailClientProps {
  user: any;
}

function ConfirmDeleteModal({ onConfirm, onCancel, userName }: { onConfirm: () => void; onCancel: () => void; userName: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 className="font-bold text-navy-900 text-lg mb-2">Delete user?</h2>
        <p className="text-sm text-gray-600 mb-1">
          You are about to permanently delete <strong>{userName}</strong>.
        </p>
        <p className="text-sm text-red-600 mb-6">
          This will remove their account and all associated data. Bookings will be retained but unlinked. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserDetailClient({ user }: UserDetailClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const { control, register, handleSubmit, watch, formState: { errors } } = useForm<AdminUserEditValues>({
    resolver: zodResolver(adminUserEditSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
      nationality: user.nationality ?? "",
      idNumber: user.idNumber ?? "",
      licenseNumber: user.licenseNumber ?? "",
      address: user.address ?? "",
      city: user.city ?? "",
      country: user.country ?? "",
      role: user.role,
      isActive: user.isActive,
      notes: user.notes ?? "",
    },
  });

  const watchedCountry = watch("country");

  const handleSave = async (data: AdminUserEditValues) => {
    setSaving(true);
    setSaveStatus("idle");
    setSaveError(null);
    try {
      const payload = {
        ...data,
        phone: data.phone?.trim() || null,
        dateOfBirth: data.dateOfBirth?.trim() || null,
        nationality: data.nationality?.trim() || null,
        idNumber: data.idNumber?.trim() || null,
        licenseNumber: data.licenseNumber?.trim() || null,
        address: data.address?.trim() || null,
        city: (data.city === "__other__" ? "" : data.city?.trim()) || null,
        country: data.country?.trim() || null,
        notes: data.notes?.trim() || null,
      };
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveStatus("success");
        setEditMode(false);
        setTimeout(() => { setSaveStatus("idle"); router.refresh(); }, 2000);
      } else {
        const data = await res.json();
        setSaveError(data.error ?? "Failed to save");
        setSaveStatus("error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/users");
      } else {
        const data = await res.json();
        setSaveError(data.error ?? "Failed to delete user");
        setSaveStatus("error");
        setShowDeleteModal(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  const totalSpent = user.bookings
    .filter((b: any) => ["CONFIRMED", "COMPLETED"].includes(b.status))
    .reduce((sum: number, b: any) => sum + b.totalAmount, 0);
  const activeBookings = user.bookings.filter((b: any) =>
    ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(b.status)
  ).length;

  const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email;

  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

  return (
    <div className="space-y-5 max-w-4xl">
      {showDeleteModal && (
        <ConfirmDeleteModal
          userName={userName}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/users" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 mb-2 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Users
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-navy-900 rounded-full flex items-center justify-center text-white font-bold shrink-0">
              {(user.firstName?.[0] ?? user.email[0]).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-900">{userName}</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="btn-secondary text-sm px-4 py-2.5 flex items-center gap-2"
              >
                <User className="h-4 w-4" /> Edit Info
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={deleting}
                className="text-sm px-4 py-2.5 flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors font-medium"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(false)} className="btn-secondary text-sm px-4 py-2.5">Cancel</button>
              <button
                onClick={handleSubmit(handleSave)}
                disabled={saving}
                className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : saveStatus === "success" ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
              </button>
            </>
          )}
        </div>
      </div>

      {saveStatus === "error" && saveError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{saveError}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: user._count.bookings },
          { label: "Active", value: activeBookings },
          { label: "Total Spent", value: formatCurrency(totalSpent) },
          { label: "Member Since", value: formatDate(user.createdAt) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-navy-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Profile info / Edit form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-gray-400" />
            <h2 className="font-bold text-navy-900">Customer Profile</h2>
          </div>

          {editMode ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name</label>
                  <input type="text" className={cn("form-input text-sm", errors.firstName && "border-red-400")} {...register("firstName")} />
                  {errors.firstName && <p className="text-xs text-red-500 mt-0.5">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input type="text" className={cn("form-input text-sm", errors.lastName && "border-red-400")} {...register("lastName")} />
                  {errors.lastName && <p className="text-xs text-red-500 mt-0.5">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label className={labelCls}>Phone</label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput value={field.value ?? ""} onChange={field.onChange} error={errors.phone?.message} />
                  )}
                />
              </div>

              <div>
                <label className={labelCls}>Date of Birth</label>
                <input
                  type="date"
                  className={cn("form-input text-sm", errors.dateOfBirth && "border-red-400")}
                  {...register("dateOfBirth")}
                />
                {errors.dateOfBirth && <p className="text-xs text-red-500 mt-0.5">{errors.dateOfBirth.message}</p>}
              </div>

              <div>
                <label className={labelCls}>Nationality</label>
                <Controller
                  name="nationality"
                  control={control}
                  render={({ field }) => (
                    <CountrySelect value={field.value ?? ""} onChange={field.onChange} valueType="nationality" placeholder="Select nationality" error={errors.nationality?.message} />
                  )}
                />
              </div>

              <div>
                <label className={labelCls}>ID / Passport No.</label>
                <input type="text" className="form-input text-sm" {...register("idNumber")} />
              </div>

              <div>
                <label className={labelCls}>Driving Licence</label>
                <input type="text" className="form-input text-sm" {...register("licenseNumber")} />
              </div>

              <div>
                <label className={labelCls}>Street Address</label>
                <input type="text" className="form-input text-sm" {...register("address")} />
              </div>

              <div>
                <label className={labelCls}>Country</label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <CountrySelect value={field.value ?? ""} onChange={field.onChange} valueType="name" placeholder="Select country" error={errors.country?.message} />
                  )}
                />
              </div>

              <div>
                <label className={labelCls}>City</label>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <CityInput value={field.value ?? ""} onChange={field.onChange} country={watchedCountry ?? ""} error={errors.city?.message} />
                  )}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-sm">
              {[
                { label: "Email", value: user.email },
                { label: "Phone", value: user.phone ?? "—", icon: Phone },
                { label: "Date of Birth", value: user.dateOfBirth ? formatDate(user.dateOfBirth) : "—" },
                { label: "Nationality", value: formatNationality(user.nationality) },
                { label: "ID / Passport No.", value: user.idNumber ?? "—", icon: FileText },
                { label: "Driving Licence", value: user.licenseNumber ?? "—", icon: FileText },
                {
                  label: "Address",
                  value: user.address
                    ? `${user.address}${user.city ? `, ${user.city}` : ""}${user.country ? `, ${user.country}` : ""}`
                    : user.city
                    ? `${user.city}${user.country ? `, ${user.country}` : ""}`
                    : user.country ?? "—",
                  icon: MapPin,
                },
                { label: "Save Profile Data", value: user.saveProfileData ? "Yes" : "No" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-3">
                  <span className="text-gray-500 shrink-0">{label}:</span>
                  <span className={`font-medium text-right ${value === "—" ? "text-gray-400" : "text-navy-900"}`}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Access control + Notes */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-navy-900 mb-4">Access Control</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Role</label>
                <select
                  className="form-input appearance-none"
                  {...register("role")}
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="h-4 w-4 rounded border-gray-300 text-navy-900"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Account Active</p>
                  <p className="text-xs text-gray-400">Uncheck to suspend login access</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-navy-900 mb-3">Admin Notes</h2>
            <textarea
              placeholder="Internal notes about this customer (not visible to them)..."
              rows={4}
              className="form-input resize-none text-sm"
              {...register("notes")}
            />
          </div>

          {/* Always-visible save button for access/notes */}
          {!editMode && (
            <button
              onClick={handleSubmit(handleSave)}
              disabled={saving}
              className="btn-primary text-sm px-4 py-2.5 w-full flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : saveStatus === "success" ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Access & Notes</>}
            </button>
          )}
        </div>
      </div>

      {/* Booking history */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-navy-900">Booking History</h2>
          <span className="text-sm text-gray-500">{user.bookings.length} bookings</span>
        </div>
        {user.bookings.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No bookings yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {user.bookings.map((booking: any) => (
              <div key={booking.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Car className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-navy-900 truncate">{booking.car.name}</p>
                    <p className="text-xs text-gray-400">{booking.bookingRef} · {formatDate(booking.pickupDateTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`status-badge text-xs hidden sm:inline-flex ${getStatusColor(booking.status)}`}>{booking.status}</span>
                  <span className="font-bold text-sm text-navy-900">{formatCurrency(booking.totalAmount)}</span>
                  <Link href={`/admin/bookings/${booking.id}`} className="text-xs text-crimson-500 hover:underline font-medium">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
