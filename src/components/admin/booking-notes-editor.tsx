// src/components/admin/booking-notes-editor.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CheckCircle } from "lucide-react";

interface BookingNotesEditorProps {
  bookingId: string;
  internalNotes: string | null;
  adminNotes: string | null;
}

export function BookingNotesEditor({
  bookingId,
  internalNotes: initInternal,
  adminNotes: initAdmin,
}: BookingNotesEditorProps) {
  const router = useRouter();
  const [internal, setInternal] = useState(initInternal ?? "");
  const [admin, setAdmin] = useState(initAdmin ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: internal, adminNotes: admin }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h2 className="font-bold text-navy-900">Notes</h2>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          Customer Special Requests
        </label>
        <textarea
          value={internal}
          onChange={(e) => setInternal(e.target.value)}
          rows={3}
          className="form-input resize-none text-sm"
          placeholder="Visible to staff — e.g. customer's special requests"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
          Admin Notes (Internal Only)
        </label>
        <textarea
          value={admin}
          onChange={(e) => setAdmin(e.target.value)}
          rows={3}
          className="form-input resize-none text-sm"
          placeholder="Internal staff notes — not visible to customer"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50"
      >
        {saving ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle className="h-4 w-4" /> Saved</>
        ) : (
          <><Save className="h-4 w-4" /> Save Notes</>
        )}
      </button>
    </div>
  );
}
