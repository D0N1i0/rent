// src/components/admin/availability-blocks-admin-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, Save, X, CalendarOff } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface AvailabilityBlockItem {
  id: string;
  carId: string;
  car: { name: string; brand: string };
  startDate: string | Date;
  endDate: string | Date;
  reason: string | null;
}

interface CarOption {
  id: string;
  name: string;
  brand: string;
}

const emptyForm = {
  carId: "",
  startDate: "",
  endDate: "",
  reason: "",
};
type FormState = typeof emptyForm;

interface FieldErrors {
  carId?: string;
  startDate?: string;
  endDate?: string;
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.carId) errors.carId = "Please select a vehicle";
  if (!form.startDate) errors.startDate = "Start date is required";
  if (!form.endDate) errors.endDate = "End date is required";
  if (form.startDate && form.endDate && form.endDate < form.startDate)
    errors.endDate = "End date must be on or after start date";
  return errors;
}

export function AvailabilityBlocksAdminClient({
  items: initialItems,
  cars,
}: {
  items: AvailabilityBlockItem[];
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

  const handleEdit = (item: AvailabilityBlockItem) => {
    setEditingId(item.id);
    setForm({
      carId: item.carId,
      startDate: new Date(item.startDate).toISOString().split("T")[0],
      endDate: new Date(item.endDate).toISOString().split("T")[0],
      reason: item.reason ?? "",
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

    try {
      const url = editingId
        ? `/api/admin/availability-blocks/${editingId}`
        : "/api/admin/availability-blocks";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: form.carId,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Failed to save block");
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

  const handleDelete = async (id: string, carName: string) => {
    if (!confirm(`Remove availability block for ${carName}?\n\nThis cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/availability-blocks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete block");
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
    children,
  }: {
    label: string;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Availability Blocks</h1>
        <p className="text-sm text-gray-500 mt-1">
          Block vehicles for service, maintenance, or manual holds. Blocked periods prevent new
          bookings.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-navy-900 text-sm">
            {editingId ? "Edit Block" : "New Availability Block"}
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

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
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

          <div className="sm:col-span-2">
            <F label="Reason (optional)">
              <textarea
                className="form-input resize-none"
                rows={2}
                placeholder="e.g. Scheduled maintenance, deep clean, reserved for event…"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </F>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                {editingId ? "Update Block" : "Create Block"}
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Vehicle
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Blocked Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Reason
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
                  <p className="text-sm font-medium text-navy-900">{item.car.name}</p>
                  <p className="text-xs text-gray-400">{item.car.brand}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <CalendarOff className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {formatDate(item.startDate)} → {formatDate(item.endDate)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.reason ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100"
                      title="Edit block"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.car.name)}
                      disabled={deleting === item.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete block"
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
                <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                  <CalendarOff className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  No availability blocks. All vehicles are currently open for booking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
