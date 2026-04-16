// src/components/admin/categories-admin-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Save, X, Loader2, Tag, AlertCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { CarCategory } from "@prisma/client";
import { cn } from "@/lib/utils";

type CategoryWithCount = CarCategory & { _count?: { cars: number } };

const emptyForm = {
  name: "",
  description: "",
  iconUrl: "",
  sortOrder: 0,
  isActive: true,
};
type FormState = typeof emptyForm;

interface FieldErrors {
  name?: string;
  general?: string;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim() || form.name.trim().length < 2)
    errors.name = "Name must be at least 2 characters";
  return errors;
}

export function CategoriesAdminClient({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reset = () => {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyForm);
    setErrors({});
  };

  const handleEdit = (item: CategoryWithCount) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      iconUrl: item.iconUrl ?? "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      iconUrl: form.iconUrl.trim() || null,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    };

    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setErrors({ general: d.error ?? "Failed to save category" });
        return;
      }

      reset();
      router.refresh();
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async (id: string) => {
    const existing = items.find(i => i.id === id);
    const name = existing?.name ?? "";
    const carCount = existing?._count?.cars ?? 0;
    if (carCount > 0) {
      alert(
        `Cannot delete "${name}" — it has ${carCount} car${carCount > 1 ? "s" : ""} linked to it. Reassign them first.`
      );
      return;
    }
    if (!confirm(`Delete category "${name}"?\n\nThis cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setDeleteError(d.error ?? "Failed to delete category");
        setDeleteConfirmId(null);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (editingId === id) reset();
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeleteConfirmId(null);
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} categor{items.length !== 1 ? "ies" : "y"}
          </p>
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
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy-900">
              {editingId ? "Edit Category" : "New Category"}
            </h3>
            <button onClick={reset} className="p-1.5 rounded-lg hover:bg-blue-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {errors.general && (
            <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errors.general}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <F label="Name *" error={errors.name}>
                <input
                  type="text"
                  className={cn("form-input", errors.name && "border-red-400")}
                  placeholder="e.g. SUVs"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </F>
            </div>

            <div className="sm:col-span-2">
              <F label="Description">
                <textarea
                  className="form-input resize-none"
                  rows={2}
                  placeholder="Short description shown to customers"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </F>
            </div>

            <F label="Icon URL">
              <input
                type="url"
                className="form-input"
                placeholder="https://…"
                value={form.iconUrl}
                onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
              />
            </F>

            <F label="Sort Order">
              <input
                type="number"
                min={0}
                className="form-input"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </F>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="catActive"
                className="h-4 w-4 rounded border-gray-300 text-navy-900"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <label htmlFor="catActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                Active (visible to customers)
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm px-4 py-2"
            >
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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Category", "Cars", "Order", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "hover:bg-gray-50/50 transition-colors",
                  editingId === item.id && "bg-blue-50"
                )}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.iconUrl} alt="" className="h-5 w-5 object-contain" />
                      ) : (
                        <Tag className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-navy-900">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-600">
                  {item._count?.cars ?? 0} car{(item._count?.cars ?? 0) !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{item.sortOrder}</td>
                <td className="px-4 py-3.5">
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
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setDeleteError(null); setDeleteConfirmId(item.id); }}
                      disabled={deleting === item.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
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
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-12 text-center">
            <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No categories yet</p>
          </div>
        )}
      </div>

      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 shadow-lg max-w-sm">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{deleteError}</p>
          <button onClick={() => setDeleteError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}
      <ConfirmDialog
        open={!!deleteConfirmId}
        title="Delete Category"
        description="This will permanently delete this category. Make sure no cars are assigned to it first."
        confirmLabel="Delete Category"
        onConfirm={() => deleteConfirmId && handleDeleteConfirmed(deleteConfirmId)}
        onCancel={() => { setDeleteConfirmId(null); setDeleteError(null); }}
        loading={!!deleting}
      />
    </div>
  );
}