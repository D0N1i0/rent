// src/components/admin/faq-admin-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import type { FaqItem } from "@prisma/client";
import { cn } from "@/lib/utils";

export function FaqAdminClient({ items: initialItems }: { items: FaqItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ question: "", answer: "", category: "general" });

  const handleSave = async (item: FaqItem) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/faq/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
        await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    setItems(items.filter(i => i.id !== id));
    router.refresh();
  };

  const handleAdd = async () => {
    if (!newItem.question.trim() || !newItem.answer.trim()) {
      alert("Question and answer are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newItem, isActive: true, sortOrder: items.length + 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems([...items, data.item]);
        setNewItem({ question: "", answer: "", category: "general" });
        setAdding(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: FaqItem) => {
    const updated = { ...item, isActive: !item.isActive };
    setItems(items.map(i => i.id === item.id ? updated : i));
    await fetch(`/api/admin/faq/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">FAQ Management</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} FAQ items</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary text-sm px-4 py-2.5">
          <Plus className="h-4 w-4" /> Add FAQ
        </button>
      </div>

      {/* Add new */}
      {adding && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-navy-900">New FAQ Item</h3>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Question</label>
            <input
              type="text"
              value={newItem.question}
              onChange={e => setNewItem(n => ({ ...n, question: e.target.value }))}
              placeholder="Enter the question..."
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Answer</label>
            <textarea
              value={newItem.answer}
              onChange={e => setNewItem(n => ({ ...n, answer: e.target.value }))}
              rows={3}
              placeholder="Enter the answer..."
              className="form-input resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Category</label>
            <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))} className="form-input">
              {["general", "booking", "payment", "insurance", "pickup", "requirements"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="btn-primary text-sm px-4 py-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save</>}
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className={cn("bg-white rounded-xl border shadow-sm", item.isActive ? "border-gray-100" : "border-gray-200 opacity-60")}>
            {editingId === item.id ? (
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Question</label>
                  <input
                    type="text"
                    defaultValue={item.question}
                    onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, question: e.target.value } : i))}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Answer</label>
                  <textarea
                    defaultValue={item.answer}
                    rows={4}
                    onChange={e => setItems(items.map(i => i.id === item.id ? { ...i, answer: e.target.value } : i))}
                    className="form-input resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSave(items.find(i => i.id === item.id)!)} disabled={saving} className="btn-primary text-sm px-4 py-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-start gap-3">
                <GripVertical className="h-5 w-5 text-gray-300 shrink-0 mt-0.5 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-navy-900">{item.question}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.answer}</p>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">{item.category}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(item)} className={cn("text-xs px-2 py-1 rounded-full font-medium border transition-colors", item.isActive ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200")}>
                    {item.isActive ? "Active" : "Hidden"}
                  </button>
                  <button onClick={() => setEditingId(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
