// src/components/admin/extras-admin-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Save, X, Loader2, Package } from "lucide-react";
import type { Extra, ExtraPricingType } from "@prisma/client";
import { formatCurrency, cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const emptyForm = { name: "", description: "", price: 0, pricingType: "PER_DAY" as ExtraPricingType, isActive: true, sortOrder: 0, protectionCategory: "" };

const pricingLabels: Record<string, string> = { PER_DAY: "Per Day", ONE_TIME: "One Time", PER_BOOKING: "Per Booking" };

export function ExtrasAdminClient({ extras: init }: { extras: Extra[] }) {
  const router = useRouter();
  const [extras, setExtras] = useState(init);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Name is required"); return; }
    if (form.price < 0) { alert("Price must be 0 or greater"); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/extras/${editingId}` : "/api/admin/extras";
      const method = editingId ? "PUT" : "POST";
      const payload = { ...form, protectionCategory: form.protectionCategory || null };
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed"); return; }
      setShowForm(false); setEditingId(null); setForm(emptyForm);
      router.refresh();
    } finally { setSaving(false); }
  };

  const handleEdit = (e: Extra) => {
    setForm({ name: e.name, description: e.description ?? "", price: Number(e.price), pricingType: e.pricingType, isActive: e.isActive, sortOrder: e.sortOrder, protectionCategory: e.protectionCategory ?? "" });
    setEditingId(e.id); setShowForm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/extras/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setExtras(extras.filter(e => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        const d = await res.json();
        alert(d.error ?? "Failed to delete");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Extras & Services</h1>
          <p className="text-gray-500 text-sm mt-1">{extras.length} extras configured</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="btn-primary text-sm px-4 py-2.5">
          <Plus className="h-4 w-4" /> Add Extra
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy-900">{editingId ? "Edit Extra" : "New Extra"}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="form-input resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Price (€) *</label>
              <input type="number" value={form.price} min={0} step={0.5} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Pricing Type</label>
              <select value={form.pricingType} onChange={e => setForm(f => ({ ...f, pricingType: e.target.value as ExtraPricingType }))} className="form-input appearance-none">
                {Object.entries(pricingLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Sort Order</label>
              <input type="number" value={form.sortOrder} min={0} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Protection / Insurance Tier</label>
              <select value={form.protectionCategory} onChange={e => setForm(f => ({ ...f, protectionCategory: e.target.value }))} className="form-input appearance-none">
                <option value="">— Not a protection extra —</option>
                <option value="BASIC">BASIC — Basic / TPL included</option>
                <option value="CDW">CDW — Collision Damage Waiver</option>
                <option value="PREMIUM">PREMIUM — Full Coverage / Zero Excess</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Use this to mark protection/insurance options. They appear as a dedicated insurance section in the booking form.</p>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="extraActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-navy-900" />
              <label htmlFor="extraActive" className="text-sm font-medium text-gray-700">Active (visible to customers)</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> {editingId ? "Update" : "Create"}</>}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Extra", "Price", "Pricing Type", "Protection Tier", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {extras.map(extra => (
              <tr key={extra.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-sm text-navy-900">{extra.name}</p>
                  {extra.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{extra.description}</p>}
                </td>
                <td className="px-4 py-3.5 font-semibold text-sm text-navy-900">{formatCurrency(extra.price)}</td>
                <td className="px-4 py-3.5">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pricingLabels[extra.pricingType]}</span>
                </td>
                <td className="px-4 py-3.5">
                  {extra.protectionCategory ? (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">{extra.protectionCategory}</span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("status-badge text-xs", extra.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200")}>
                    {extra.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(extra)} className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteTarget({ id: extra.id, name: extra.name })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {extras.length === 0 && (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No extras configured yet</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This extra will be permanently removed. Any existing bookings that include it will not be affected."
        confirmLabel="Delete Extra"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
