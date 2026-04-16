// src/components/admin/locations-admin-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MapPin, Loader2, Save, X, Plane } from "lucide-react";
import type { Location } from "@prisma/client";
import { cn } from "@/lib/utils";

const emptyForm = { name: "", city: "", address: "", isAirport: false, pickupFee: 0, dropoffFee: 0, isPickupPoint: true, isDropoffPoint: true, isActive: true, description: "" };

export function LocationsAdminClient({ locations: init }: { locations: Location[] }) {
  const router = useRouter();
  const [locations, setLocations] = useState(init);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim()) {
      alert("Name and city are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/locations/${editingId}` : "/api/admin/locations";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to save");
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (loc: Location) => {
    setForm({
      name: loc.name, city: loc.city, address: loc.address ?? "",
      isAirport: loc.isAirport, pickupFee: loc.pickupFee, dropoffFee: loc.dropoffFee,
      isPickupPoint: loc.isPickupPoint, isDropoffPoint: loc.isDropoffPoint,
      isActive: loc.isActive, description: loc.description ?? "",
    });
    setEditingId(loc.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
        await fetch(`/api/admin/locations/${id}`, { method: "DELETE" });
    setLocations(locations.filter(l => l.id !== id));
  };

  const FormPanel = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-navy-900">{editingId ? "Edit Location" : "New Location"}</h3>
        <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="p-1.5 rounded-lg hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Location Name *</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Prishtina Airport" className="form-input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">City *</label>
          <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Prishtina" className="form-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Address</label>
          <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="form-input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Pickup Fee (€)</label>
          <input type="number" value={form.pickupFee} min={0} step={1} onChange={e => setForm(f => ({ ...f, pickupFee: Number(e.target.value) }))} className="form-input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Drop-off Fee (€)</label>
          <input type="number" value={form.dropoffFee} min={0} step={1} onChange={e => setForm(f => ({ ...f, dropoffFee: Number(e.target.value) }))} className="form-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="form-input resize-none" />
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-4">
          {[
            { key: "isAirport", label: "Airport Location" },
            { key: "isPickupPoint", label: "Pickup Point" },
            { key: "isDropoffPoint", label: "Drop-off Point" },
            { key: "isActive", label: "Active" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-navy-900" />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> {editingId ? "Update" : "Create"}</>}
        </button>
        <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Pickup & Drop-off Locations</h1>
          <p className="text-gray-500 text-sm mt-1">{locations.length} locations configured</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="btn-primary text-sm px-4 py-2.5">
          <Plus className="h-4 w-4" /> Add Location
        </button>
      </div>

      {showForm && <FormPanel />}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Location", "City", "Pickup Fee", "Drop-off Fee", "Type", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {locations.map(loc => (
              <tr key={loc.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    {loc.isAirport ? <Plane className="h-4 w-4 text-blue-500 shrink-0" /> : <MapPin className="h-4 w-4 text-gray-400 shrink-0" />}
                    <span className="font-medium text-sm text-navy-900">{loc.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{loc.city}</td>
                <td className="px-4 py-3.5 text-sm text-gray-600">€{loc.pickupFee}</td>
                <td className="px-4 py-3.5 text-sm text-gray-600">€{loc.dropoffFee}</td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1 flex-wrap">
                    {loc.isPickupPoint && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Pickup</span>}
                    {loc.isDropoffPoint && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Drop-off</span>}
                    {loc.isAirport && <span className="text-xs bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded">Airport</span>}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("status-badge text-xs", loc.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200")}>
                    {loc.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(loc)} className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(loc.id, loc.name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
