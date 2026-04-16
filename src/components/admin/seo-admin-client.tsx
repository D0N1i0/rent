// src/components/admin/seo-admin-client.tsx
"use client";

import React, { useState } from "react";
import { Save, Loader2, CheckCircle, AlertCircle, Globe } from "lucide-react";

interface SeoPage {
  key: string;
  label: string;
}

interface SeoRecord {
  id: string;
  page: string;
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
}

interface SeoAdminClientProps {
  pages: SeoPage[];
  seoMap: Record<string, SeoRecord | undefined>;
}

type SeoValues = {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
};

export function SeoAdminClient({ pages, seoMap }: SeoAdminClientProps) {
  const [activePage, setActivePage] = useState(pages[0]?.key ?? "");
  const [values, setValues] = useState<Record<string, SeoValues>>(() => {
    const map: Record<string, SeoValues> = {};
    pages.forEach((p) => {
      const r = seoMap[p.key];
      map[p.key] = {
        title: r?.title ?? "",
        description: r?.description ?? "",
        keywords: r?.keywords ?? "",
        ogTitle: r?.ogTitle ?? "",
        ogDescription: r?.ogDescription ?? "",
      };
    });
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/admin/seo/${activePage}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values[activePage]),
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const current = values[activePage] ?? { title: "", description: "", keywords: "", ogTitle: "", ogDescription: "" };
  const update = (field: keyof SeoValues, val: string) =>
    setValues((v: Record<string, SeoValues>) => ({ ...v, [activePage]: { ...v[activePage], [field]: val } }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <Globe className="h-6 w-6 text-gray-400" /> SEO Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage SEO metadata for each public page
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : status === "success" ? (
            <><CheckCircle className="h-4 w-4" /> Saved!</>
          ) : (
            <><Save className="h-4 w-4" /> Save Page SEO</>
          )}
        </button>
      </div>

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700">Failed to save. Please try again.</p>
        </div>
      )}

      <div className="flex gap-6">
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {pages.map((p) => {
              const hasSeo = !!(seoMap[p.key]?.title || values[p.key]?.title);
              return (
                <button
                  key={p.key}
                  onClick={() => setActivePage(p.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                    activePage === p.key
                      ? "bg-navy-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p.label}
                  {hasSeo && (
                    <span className={`h-2 w-2 rounded-full ${activePage === p.key ? "bg-green-400" : "bg-green-500"}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-navy-900 text-lg">
            {pages.find((p) => p.key === activePage)?.label} — SEO
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Page Title <span className="text-gray-400 normal-case">(max 60 chars)</span>
            </label>
            <input
              type="text"
              value={current.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update("title", e.target.value)}
              maxLength={60}
              placeholder="AutoKos | Car Rental Kosovo"
              className="form-input"
            />
            <p className="text-xs text-gray-400 mt-1">{current.title.length}/60</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Meta Description <span className="text-gray-400 normal-case">(max 160 chars)</span>
            </label>
            <textarea
              value={current.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update("description", e.target.value)}
              rows={3}
              maxLength={160}
              placeholder="Rent a car in Kosovo with transparent pricing..."
              className="form-input resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{current.description.length}/160</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Keywords
            </label>
            <input
              type="text"
              value={current.keywords}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update("keywords", e.target.value)}
              placeholder="car rental Kosovo, rent a car Prishtina, ..."
              className="form-input"
            />
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Open Graph (Social Sharing)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  OG Title <span className="text-gray-400 normal-case">(max 60 chars — leave blank to use page title)</span>
                </label>
                <input
                  type="text"
                  value={current.ogTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update("ogTitle", e.target.value)}
                  maxLength={60}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  OG Description <span className="text-gray-400 normal-case">(leave blank to use meta description)</span>
                </label>
                <textarea
                  value={current.ogDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update("ogDescription", e.target.value)}
                  rows={2}
                  maxLength={160}
                  className="form-input resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
