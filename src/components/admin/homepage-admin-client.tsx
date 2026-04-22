// src/components/admin/homepage-admin-client.tsx
"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle, AlertCircle, Globe } from "lucide-react";

interface HomepageAdminClientProps {
  settings: Record<string, string>;
  seo: { id: string; title?: string | null; description?: string | null; keywords?: string | null } | null;
}

const fieldGroups = [
  {
    title: "Hero Section",
    fields: [
      { key: "hero_badge", label: "Hero Badge Text", type: "text" },
      { key: "hero_title_en", label: "Hero Title (English)", type: "text" },
      { key: "hero_subtitle_en", label: "Hero Subtitle (English)", type: "textarea" },
      { key: "hero_stat_customers", label: "Stat — Customers", type: "text" },
      { key: "hero_stat_fleet", label: "Stat — Fleet Size", type: "text" },
      { key: "hero_stat_locations", label: "Stat — Locations", type: "text" },
    ],
  },
  {
    title: "Why Choose Us",
    fields: [
      { key: "why_title", label: "Section Title", type: "text" },
      { key: "why_subtitle", label: "Section Subtitle", type: "textarea" },
      { key: "why_1_title", label: "Reason 1 — Title", type: "text" },
      { key: "why_1_body", label: "Reason 1 — Description", type: "textarea" },
      { key: "why_2_title", label: "Reason 2 — Title", type: "text" },
      { key: "why_2_body", label: "Reason 2 — Description", type: "textarea" },
      { key: "why_3_title", label: "Reason 3 — Title", type: "text" },
      { key: "why_3_body", label: "Reason 3 — Description", type: "textarea" },
      { key: "why_4_title", label: "Reason 4 — Title", type: "text" },
      { key: "why_4_body", label: "Reason 4 — Description", type: "textarea" },
      { key: "why_5_title", label: "Reason 5 — Title", type: "text" },
      { key: "why_5_body", label: "Reason 5 — Description", type: "textarea" },
      { key: "why_6_title", label: "Reason 6 — Title", type: "text" },
      { key: "why_6_body", label: "Reason 6 — Description", type: "textarea" },
    ],
  },
  {
    title: "How It Works",
    fields: [
      { key: "how_title", label: "Section Title", type: "text" },
      { key: "how_subtitle", label: "Section Subtitle", type: "textarea" },
      { key: "how_1_title", label: "Step 1 — Title", type: "text" },
      { key: "how_1_body", label: "Step 1 — Description", type: "textarea" },
      { key: "how_2_title", label: "Step 2 — Title", type: "text" },
      { key: "how_2_body", label: "Step 2 — Description", type: "textarea" },
      { key: "how_3_title", label: "Step 3 — Title", type: "text" },
      { key: "how_3_body", label: "Step 3 — Description", type: "textarea" },
      { key: "how_4_title", label: "Step 4 — Title", type: "text" },
      { key: "how_4_body", label: "Step 4 — Description", type: "textarea" },
    ],
  },
  {
    title: "Airport Section",
    fields: [
      { key: "airport_title", label: "Section Title", type: "text" },
      { key: "airport_description", label: "Description", type: "textarea" },
      { key: "airport_fee", label: "Airport Fee Label", type: "text" },
      { key: "airport_meet_greet_fee", label: "Meet & Greet Fee Label", type: "text" },
    ],
  },
  {
    title: "Featured Cars",
    fields: [
      { key: "featured_cars_title", label: "Featured Cars - Section Title", type: "text" },
      { key: "featured_cars_subtitle", label: "Featured Cars - Subtitle", type: "textarea" },
    ],
  },
  {
    title: "Testimonials",
    fields: [
      { key: "testimonials_title", label: "Testimonials - Section Title", type: "text" },
    ],
  },
  {
    title: "Offers",
    fields: [
      { key: "offers_title", label: "Offers - Section Title", type: "text" },
    ],
  },
  {
    title: "Contact CTA Section",
    fields: [
      { key: "contact_cta_title", label: "CTA Title", type: "text" },
      { key: "contact_cta_description", label: "CTA Description", type: "textarea" },
      { key: "contact_cta_whatsapp_message", label: "WhatsApp Pre-fill Message", type: "text" },
    ],
  },
];

export function HomepageAdminClient({ settings: init, seo: initSeo }: HomepageAdminClientProps) {
  const [values, setValues] = useState(init);
  const [seo, setSeo] = useState({
    title: initSeo?.title ?? "",
    description: initSeo?.description ?? "",
    keywords: initSeo?.keywords ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeGroup, setActiveGroup] = useState(fieldGroups[0].title);

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const [settingsRes, seoRes] = await Promise.all([
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: values }),
        }),
        fetch("/api/admin/seo/home", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(seo),
        }),
      ]);
      if (!settingsRes.ok || !seoRes.ok) throw new Error("Save failed");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const current = fieldGroups.find((g) => g.title === activeGroup);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Homepage Content</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all homepage sections — hero, features, steps, CTAs, and SEO
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
          ) : status === "success" ? (
            <><CheckCircle className="h-4 w-4" /> Saved!</>
          ) : (
            <><Save className="h-4 w-4" /> Save Changes</>
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
        {/* Section tabs */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {fieldGroups.map((g) => (
              <button
                key={g.title}
                onClick={() => setActiveGroup(g.title)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeGroup === g.title
                    ? "bg-navy-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {g.title}
              </button>
            ))}
            <button
              onClick={() => setActiveGroup("SEO")}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeGroup === "SEO"
                  ? "bg-navy-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Globe className="h-3.5 w-3.5" /> Homepage SEO
            </button>
          </nav>
        </div>

        {/* Form area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {activeGroup === "SEO" ? (
            <>
              <h2 className="font-bold text-navy-900 mb-5 flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-400" /> Homepage SEO
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    SEO Title <span className="text-gray-400 normal-case">(max 60 chars)</span>
                  </label>
                  <input
                    type="text"
                    value={seo.title}
                    onChange={(e) => setSeo((s) => ({ ...s, title: e.target.value }))}
                    maxLength={60}
                    className="form-input"
                  />
                  <p className="text-xs text-gray-400 mt-1">{seo.title.length}/60</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Meta Description <span className="text-gray-400 normal-case">(max 160 chars)</span>
                  </label>
                  <textarea
                    value={seo.description}
                    onChange={(e) => setSeo((s) => ({ ...s, description: e.target.value }))}
                    rows={3}
                    maxLength={160}
                    className="form-input resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{seo.description.length}/160</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={seo.keywords}
                    onChange={(e) => setSeo((s) => ({ ...s, keywords: e.target.value }))}
                    placeholder="car rental Kosovo, rent a car Prishtina, ..."
                    className="form-input"
                  />
                </div>
              </div>
            </>
          ) : (
            current && (
              <>
                <h2 className="font-bold text-navy-900 mb-5">{current.title}</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {current.fields.map((field) => (
                    <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        {field.label}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          value={values[field.key] ?? ""}
                          onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                          rows={3}
                          className="form-input resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={values[field.key] ?? ""}
                          onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                          className="form-input"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
