// src/components/admin/legal-admin-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CheckCircle, FileText, Eye } from "lucide-react";
import type { LegalPage } from "@prisma/client";
import Link from "next/link";

const slugLabels: Record<string, string> = {
  "terms-and-conditions": "Terms & Conditions",
  "privacy-policy": "Privacy Policy",
  "rental-policy": "Rental Policy",
};

const slugPaths: Record<string, string> = {
  "terms-and-conditions": "/terms",
  "privacy-policy": "/privacy",
  "rental-policy": "/rental-policy",
};

export function LegalAdminClient({ pages }: { pages: LegalPage[] }) {
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState(pages[0]?.slug ?? "");
  const [contents, setContents] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    pages.forEach(p => { m[p.slug] = p.content; });
    return m;
  });
  const [titles, setTitles] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    pages.forEach(p => { m[p.slug] = p.title; });
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activePage = pages.find(p => p.slug === activeSlug);

  const handleSave = async () => {
    if (!activePage) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/legal/${activePage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titles[activeSlug], content: contents[activeSlug] }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Legal Pages</h1>
          <p className="text-gray-500 text-sm mt-1">Edit your Terms, Privacy Policy, and Rental Policy</p>
        </div>
        <div className="flex items-center gap-2">
          {activePage && slugPaths[activeSlug] && (
            <Link href={slugPaths[activeSlug]} target="_blank" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Eye className="h-4 w-4" /> Preview
            </Link>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 shrink-0 space-y-1">
          {pages.map(p => (
            <button
              key={p.slug}
              onClick={() => setActiveSlug(p.slug)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${activeSlug === p.slug ? "bg-navy-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              {slugLabels[p.slug] ?? p.title}
            </button>
          ))}
        </div>

        {/* Editor */}
        {activePage && (
          <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Page Title</label>
              <input
                type="text"
                value={titles[activeSlug] ?? ""}
                onChange={e => setTitles(t => ({ ...t, [activeSlug]: e.target.value }))}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Content (Markdown supported)</label>
              <textarea
                value={contents[activeSlug] ?? ""}
                onChange={e => setContents(c => ({ ...c, [activeSlug]: e.target.value }))}
                rows={30}
                className="form-input resize-y font-mono text-sm leading-relaxed"
                placeholder="Write your legal content using Markdown..."
              />
            </div>
            <p className="text-xs text-gray-400">
              Tip: Use # for main headings, ## for subheadings, **bold**, and - for bullet points. All changes are immediately live after saving.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
