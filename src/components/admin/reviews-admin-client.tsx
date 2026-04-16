// src/components/admin/reviews-admin-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Save, X, Loader2, Star } from "lucide-react";
import type { Testimonial } from "@prisma/client";
import { cn } from "@/lib/utils";

const emptyForm = { name: "", location: "", content: "", rating: 5, isActive: true, isFeatured: false, sortOrder: 0 };

export function ReviewsAdminClient({ reviews: init }: { reviews: Testimonial[] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(init);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const reset = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) { alert("Name and review content are required"); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/reviews/${editingId}` : "/api/admin/reviews";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed"); return; }
      const data = await res.json();
      if (editingId) {
        setReviews(reviews.map(r => r.id === editingId ? data.review : r));
      } else {
        setReviews([...reviews, data.review]);
      }
      reset(); router.refresh();
    } finally { setSaving(false); }
  };

  const handleEdit = (r: Testimonial) => {
    setForm({ name: r.name, location: r.location ?? "", content: r.content, rating: r.rating, isActive: r.isActive, isFeatured: r.isFeatured, sortOrder: r.sortOrder });
    setEditingId(r.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
        await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setReviews(reviews.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Reviews & Testimonials</h1>
          <p className="text-gray-500 text-sm mt-1">{reviews.length} reviews</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="btn-primary text-sm px-4 py-2.5">
          <Plus className="h-4 w-4" /> Add Review
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy-900">{editingId ? "Edit Review" : "Add Review"}</h3>
            <button onClick={reset}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Customer Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Location</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. London, UK" className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Review Text *</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={3} className="form-input resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Rating (1-5)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}
                    className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-colors", form.rating >= n ? "text-yellow-400" : "text-gray-300")}>
                    <Star className={cn("h-5 w-5", form.rating >= n && "fill-yellow-400")} />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600 self-center">{form.rating}/5</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded" />
                Active
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="h-4 w-4 rounded" />
                Featured on homepage
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> {editingId ? "Update" : "Add"}</>}
            </button>
            <button onClick={reset} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map(review => (
          <div key={review.id} className={cn("bg-white rounded-xl border shadow-sm p-5", !review.isActive && "opacity-60")}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={cn("h-4 w-4", review.rating >= n ? "text-yellow-400 fill-yellow-400" : "text-gray-200")} />
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(review)} className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(review.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <p className="text-sm text-gray-700 italic mb-3 line-clamp-3">"{review.content}"</p>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-navy-900 rounded-full flex items-center justify-center text-white text-xs font-bold">{review.name[0]}</div>
              <div>
                <p className="text-xs font-semibold text-navy-900">{review.name}</p>
                {review.location && <p className="text-xs text-gray-400">{review.location}</p>}
              </div>
            </div>
            <div className="flex gap-1 mt-3">
              <span className={cn("status-badge text-xs", review.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200")}>
                {review.isActive ? "Active" : "Hidden"}
              </span>
              {review.isFeatured && <span className="status-badge text-xs bg-blue-50 text-blue-700 border-blue-200">Featured</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
