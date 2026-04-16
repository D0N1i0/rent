// src/components/admin/seasonal-pricing-admin-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, Save, X, CalendarRange } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface SeasonalPricingItem {
  id: string;
  carId: string;
  car: { name: string };
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  pricePerDay: number;
  pricePerWeek: number | null;
  isActive: boolean;
}

interface CarOption {
  id: string;
  name: string;
  brand: string;
}

const emptyForm = {
  carId: "",
  name: "",
  startDate: "",
  endDate: "",
  pricePerDay: "",
  pricePerWeek: "",
  isActive: true,
};
type FormState = typeof emptyForm;

interface FieldErrors {
  carId?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  pricePerDay?: string;
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.carId) errors.carId = "Please select a vehicle";
  if (!form.name.trim() || form.name.trim().length < 2)
    errors.name = "Rule name must be at least 2 characters";
  if (!form.startDate) errors.startDate = "Start date is required";
  if (!form.endDate) errors.endDate = "End date is required";
  if (form.startDate && form.endDate && form.endDate <= form.startDate)
    errors.endDate = "End date must be after start date";
  if (!form.pricePerDay || Number(form.pricePerDay) <= 0)
    errors.pricePerDay = "Daily price must be greater than 0";
  return errors;
}

export function SeasonalPricingAdminClient({
  items: initialItems,
  cars,
}: {
  items: SeasonalPricingItem[];
  cars: CarOption[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm, carId: cars[0]?.id ?? "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const reset = () => {
    setEditingId(null);
    setForm({ ...emptyForm, carId: cars[0]?.id ?? "" });
    setErrors({});
  };

  const handleEdit = (item: SeasonalPricingItem) => {
    setEditingId(item.id);
    setForm({
      carId: item.carId,
      name: item.name,
      startDate: new Date(item.startDate).toISOString().split("T")[0],
      endDate: new Date(item.endDate).toISOString().split("T")[0],
      pricePerDay: String(item.pricePerDay),
      pricePerWeek: item.pricePerWeek != null ? String(item.pricePerWeek) : "",
      isActive: item.isActive,
    });
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
      carId: form.carId,
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      pricePerDay: Number(form.pricePerDay),
      pricePerWeek: form.pricePerWeek ? Number(form.pricePerWeek) : null,
      isActive: form.isActive,
    };

    try {
      const url = editingId
        ? `/api/admin/seasonal-pricing/${editingId}`
        : "/api/admin/seasonal-pricing";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Failed to save seasonal pricing rule");
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete seasonal pricing rule "${name}"?\n\nThis cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/seasonal-pricing/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete rule");
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (editingId === id) reset();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Seasonal Pricing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Date-based pricing windows per vehicle. A rate applies only when the entire booking falls
          within the period.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-navy-900 text-sm">
            {editingId ? "Edit Pricing Rule" : "New Pricing Rule"}
          </h2>
          {editingId && (
            <button
              onClick={reset}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <F label="Vehicle *" error={errors.carId}>
            <select
              className={cn("form-input", errors.carId && "border-red-400")}
              value={form.carId}
              onChange={(e) => setForm((f) => ({ ...f, carId: e.target.value }))}
            >
              <option value="">Select vehicle…</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.name}
                </option>
              ))}
            </select>
          </F>

          <div className="sm:col-span-2">
            <F label="Rule Name *" error={errors.name}>
              <input
                type="text"
                className={cn("form-input", errors.name && "border-red-400")}
                placeholder="e.g. Summer High Season"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </F>
          </div>

          <F label="Start Date *" error={errors.startDate}>
            <input
              type="date"
              className={cn("form-input", errors.startDate && "border-red-400")}
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </F>

          <F label="End Date *" error={errors.endDate}>
            <input
              type="date"
              className={cn("form-input", errors.endDate && "border-red-400")}
              min={form.startDate || undefined}
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </F>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-navy-900"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active (applied to bookings)
            </label>
          </div>

          <F label="Daily Price (€) *" error={errors.pricePerDay}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
              <input
                type="number"
                className={cn("form-input pl-7", errors.pricePerDay && "border-red-400")}
                placeholder="0.00"
                min={0}
                step={0.01}
                value={form.pricePerDay}
                onChange={(e) => setForm((f) => ({ ...f, pricePerDay: e.target.value }))}
              />
            </div>
          </F>

          <F
            label="Weekly Price (€)"
            hint="If set, applies when rental ≥ 7 days within this season."
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
              <input
                type="number"
                className="form-input pl-7"
                placeholder="Optional"
                min={0}
                step={0.01}
                value={form.pricePerWeek}
                onChange={(e) => setForm((f) => ({ ...f, pricePerWeek: e.target.value }))}
              />
            </div>
          </F>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                {editingId ? "Update Rule" : "Create Rule"}
              </>
            )}
          </button>
          {editingId && (
            <button
              onClick={reset}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Cross-season info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Cross-season bookings:</strong> A seasonal rate only applies when the entire booking
        falls within one period. Bookings spanning multiple seasons use the car&apos;s base price.
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Vehicle / Rule
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Pricing
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  editingId === item.id && "bg-blue-50"
                )}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-navy-900 text-sm">{item.car.name}</p>
                  <p className="text-xs text-gray-500">{item.name}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <CalendarRange className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {formatDate(item.startDate)} → {formatDate(item.endDate)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-navy-900">
                    €{item.pricePerDay.toFixed(2)}/day
                  </p>
                  {item.pricePerWeek != null && (
                    <p className="text-xs text-gray-500">
                      €{item.pricePerWeek.toFixed(2)}/week
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "status-badge text-xs",
                      item.isActive
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    )}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100"
                      title="Edit rule"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      disabled={deleting === item.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete rule"
                    >
                      {deleting === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  <CalendarRange className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  No seasonal pricing rules yet. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
