// src/components/admin/offers-admin-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Save, X, Loader2, Tag } from "lucide-react";
import type { Offer } from "@prisma/client";
import { formatDate, cn } from "@/lib/utils";

const emptyForm = {
  title: "",
  description: "",
  code: "",
  discountPct: "",
  discountAmt: "",
  imageUrl: "",
  minSubtotal: "",
  minRentalDays: "",
  validFrom: "",
  validUntil: "",
  isActive: true,
  sortOrder: 0,
};
type FormState = typeof emptyForm;

interface FieldErrors {
  title?: string;
  discount?: string;
  validUntil?: string;
  minRentalDays?: string;
  minSubtotal?: string;
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.title.trim() || form.title.trim().length < 2)
    errors.title = "Title must be at least 2 characters";
  if (!form.discountPct && !form.discountAmt)
    errors.discount = "At least one discount type (% or fixed €) is required";
  if (form.validFrom && form.validUntil && form.validUntil <= form.validFrom)
    errors.validUntil = "Valid until must be after valid from";
  if (form.minRentalDays && Number(form.minRentalDays) < 1)
    errors.minRentalDays = "Minimum rental days must be at least 1";
  if (form.minSubtotal && Number(form.minSubtotal) < 0)
    errors.minSubtotal = "Minimum subtotal must be 0 or greater";
  return errors;
}

export function OffersAdminClient({ offers: init }: { offers: Offer[] }) {
  const router = useRouter();
  const [offers, setOffers] = useState(init);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const reset = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleSave = async () => {
    const fieldErrors = validateForm(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      code: form.code.trim().toUpperCase() || null,
      discountPct: form.discountPct ? Number(form.discountPct) : null,
      discountAmt: form.discountAmt ? Number(form.discountAmt) : null,
      imageUrl: form.imageUrl.trim() || null,
      minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : null,
      minRentalDays: form.minRentalDays ? Number(form.minRentalDays) : null,
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
    };

    try {
      const url = editingId ? `/api/admin/offers/${editingId}` : "/api/admin/offers";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        alert(d.error ?? "Failed to save offer");
        return;
      }
      reset();
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (o: Offer) => {
    // datetime-local input expects "YYYY-MM-DDTHH:mm" (no seconds, no Z)
    const toDatetimeLocal = (d: Date | string | null | undefined) => {
      if (!d) return "";
      const iso = new Date(d).toISOString(); // always UTC "Z"
      return iso.slice(0, 16); // "YYYY-MM-DDTHH:mm"
    };
    setForm({
      title: o.title,
      description: o.description ?? "",
      code: o.code ?? "",
      discountPct: o.discountPct?.toString() ?? "",
      discountAmt: o.discountAmt?.toString() ?? "",
      imageUrl: (o as Offer & { imageUrl?: string | null }).imageUrl ?? "",
      minSubtotal: (o as Offer & { minSubtotal?: number | null }).minSubtotal?.toString() ?? "",
      minRentalDays:
        (o as Offer & { minRentalDays?: number | null }).minRentalDays?.toString() ?? "",
      validFrom: toDatetimeLocal(o.validFrom),
      validUntil: toDatetimeLocal(o.validUntil),
      isActive: o.isActive,
      sortOrder: o.sortOrder,
    });
    setErrors({});
    setEditingId(o.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete offer "${title}"?\n\nThis cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete offer");
        return;
      }
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const F = ({
    label,
    error,
    hint,
    children,
  }: {
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Offers & Promotions</h1>
          <p className="text-gray-500 text-sm mt-1">{offers.length} offer{offers.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setErrors({});
            setShowForm(true);
          }}
          className="btn-primary text-sm px-4 py-2.5"
        >
          <Plus className="h-4 w-4" /> New Offer
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy-900">{editingId ? "Edit Offer" : "New Offer"}</h3>
            <button onClick={reset} className="p-1.5 rounded-lg hover:bg-blue-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <F label="Title *" error={errors.title}>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={cn("form-input", errors.title && "border-red-400")}
                  placeholder="e.g. Summer Special"
                />
              </F>
            </div>

            <div className="sm:col-span-2">
              <F label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="form-input resize-none"
                  placeholder="Brief description shown to customers"
                />
              </F>
            </div>

            <F
              label="Coupon Code"
              hint="Leave blank for automatic promotions (no code required)."
            >
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                onBlur={(e) => setForm((f) => ({ ...f, code: e.target.value.trim().toUpperCase() }))}
                placeholder="e.g. SUMMER15"
                className="form-input font-mono"
              />
            </F>

            <F
              label="Image URL"
              hint="Optional banner image shown on the offers page."
            >
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://…"
                className="form-input"
              />
            </F>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Discount *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    value={form.discountPct}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) => setForm((f) => ({ ...f, discountPct: e.target.value }))}
                    className={cn("form-input pr-7", errors.discount && "border-red-400")}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                  <input
                    type="number"
                    value={form.discountAmt}
                    min={0}
                    step={1}
                    onChange={(e) => setForm((f) => ({ ...f, discountAmt: e.target.value }))}
                    className={cn("form-input pl-7", errors.discount && "border-red-400")}
                    placeholder="0"
                  />
                </div>
              </div>
              {errors.discount && <p className="mt-1 text-xs text-red-600">{errors.discount}</p>}
              <p className="mt-1 text-xs text-gray-400">Both can apply simultaneously (% + fixed).</p>
            </div>

            <F
              label="Min. Subtotal (€)"
              error={errors.minSubtotal}
              hint="Offer only applies if booking subtotal is at least this amount."
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                <input
                  type="number"
                  value={form.minSubtotal}
                  min={0}
                  step={1}
                  onChange={(e) => setForm((f) => ({ ...f, minSubtotal: e.target.value }))}
                  className={cn("form-input pl-7", errors.minSubtotal && "border-red-400")}
                  placeholder="No minimum"
                />
              </div>
            </F>

            <F
              label="Min. Rental Days"
              error={errors.minRentalDays}
              hint="Offer only applies for rentals of at least this many days."
            >
              <input
                type="number"
                value={form.minRentalDays}
                min={1}
                step={1}
                onChange={(e) => setForm((f) => ({ ...f, minRentalDays: e.target.value }))}
                className={cn("form-input", errors.minRentalDays && "border-red-400")}
                placeholder="No minimum"
              />
            </F>

            <F label="Valid From">
              <input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                className="form-input"
              />
            </F>

            <F label="Valid Until" error={errors.validUntil}>
              <input
                type="datetime-local"
                value={form.validUntil}
                min={form.validFrom || undefined}
                onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                className={cn("form-input", errors.validUntil && "border-red-400")}
              />
            </F>

            <F label="Sort Order">
              <input
                type="number"
                value={form.sortOrder}
                min={0}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="form-input"
              />
            </F>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-navy-900"
                />
                Active (visible on site)
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editingId ? "Update" : "Create"}
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => {
          const o = offer as Offer & { minSubtotal?: number | null; minRentalDays?: number | null };

          // Compute a 4-state validity status for immediate admin clarity
          const now = new Date();
          const validFrom = offer.validFrom ? new Date(offer.validFrom) : null;
          const validUntil = offer.validUntil ? new Date(offer.validUntil) : null;
          let offerStatus: "active" | "expired" | "upcoming" | "inactive";
          if (!offer.isActive) {
            offerStatus = "inactive";
          } else if (validUntil && validUntil < now) {
            offerStatus = "expired";
          } else if (validFrom && validFrom > now) {
            offerStatus = "upcoming";
          } else {
            offerStatus = "active";
          }
          const statusConfig = {
            active:   { label: "Active",   cls: "bg-green-50 text-green-700 border-green-200" },
            expired:  { label: "Expired",  cls: "bg-gray-50 text-gray-500 border-gray-200" },
            upcoming: { label: "Upcoming", cls: "bg-blue-50 text-blue-700 border-blue-200" },
            inactive: { label: "Inactive", cls: "bg-gray-50 text-gray-500 border-gray-200" },
          }[offerStatus];

          return (
            <div
              key={offer.id}
              className={cn(
                "bg-white rounded-xl border shadow-sm p-5",
                offerStatus === "active" ? "border-gray-100" : "border-gray-200 opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 bg-crimson-50 rounded-lg flex items-center justify-center">
                  <Tag className="h-5 w-5 text-crimson-500" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(offer)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100"
                    title="Edit offer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id, offer.title)}
                    disabled={deleting === offer.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete offer"
                  >
                    {deleting === offer.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-navy-900 mb-1">{offer.title}</h3>
              {offer.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{offer.description}</p>
              )}

              <div className="space-y-1.5">
                {offer.code && (
                  <p className="font-mono text-xs bg-gray-100 text-navy-900 px-2 py-1 rounded inline-block font-bold">
                    {offer.code}
                  </p>
                )}
                {(offer.discountPct || offer.discountAmt) && (
                  <p className="text-sm font-bold text-crimson-600">
                    {[
                      offer.discountPct ? `-${offer.discountPct}%` : null,
                      offer.discountAmt ? `-€${offer.discountAmt}` : null,
                    ]
                      .filter(Boolean)
                      .join(" + ")}{" "}
                    off
                  </p>
                )}
                {o.minSubtotal != null && (
                  <p className="text-xs text-gray-400">Min. subtotal €{o.minSubtotal}</p>
                )}
                {o.minRentalDays != null && (
                  <p className="text-xs text-gray-400">Min. {o.minRentalDays} day{o.minRentalDays !== 1 ? "s" : ""}</p>
                )}
                {validFrom && (
                  <p className="text-xs text-gray-400">From {formatDate(validFrom)}</p>
                )}
                {validUntil && (
                  <p className="text-xs text-gray-400">Until {formatDate(validUntil)}</p>
                )}
              </div>

              <span
                className={cn(
                  "mt-3 inline-flex status-badge text-xs",
                  statusConfig.cls
                )}
              >
                {statusConfig.label}
              </span>
            </div>
          );
        })}
        {offers.length === 0 && (
          <div className="col-span-3 p-12 text-center bg-white rounded-xl border border-gray-100">
            <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No offers yet. Create your first promotion above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
