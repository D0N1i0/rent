// src/components/admin/settings-client.tsx
"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface SettingItem {
  id: string;
  key: string;
  value: string;
  label: string | null;
  type: string;
  group: string;
}

interface GroupedSettings {
  group: string;
  items: SettingItem[];
}

interface SettingsClientProps {
  grouped: GroupedSettings[];
}

const groupLabels: Record<string, string> = {
  business: "Business Information",
  contact: "Contact Details",
  branding: "Branding & Logo",
  social: "Social Media Links",
  homepage: "Homepage Content",
  booking: "Booking Rules",
  footer: "Footer Content",
};

function validateField(key: string, type: string, value: string): string | null {
  if (!value) return null; // empty is allowed (optional fields)

  if (type === "url") {
    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      return "URL must start with http:// or https://";
    }
  }

  if (key.toLowerCase().includes("email")) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
  }

  return null;
}

export function SettingsClient({ grouped }: SettingsClientProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    grouped.forEach(g => g.items.forEach(i => { map[i.key] = i.value; }));
    return map;
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeGroup, setActiveGroup] = useState(grouped[0]?.group ?? "");

  const handleChange = (key: string, type: string, value: string) => {
    setValues(v => ({ ...v, [key]: value }));
    const error = validateField(key, type, value);
    setFieldErrors(e => {
      const next = { ...e };
      if (error) {
        next[key] = error;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};
    grouped.forEach(g =>
      g.items.forEach(item => {
        const error = validateField(item.key, item.type, values[item.key] ?? "");
        if (error) errors[item.key] = error;
      })
    );
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateAll()) return;
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const hasErrors = Object.keys(fieldErrors).length > 0;
  const currentGroup = grouped.find(g => g.group === activeGroup);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Site Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all business and site configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || hasErrors}
          title={hasErrors ? "Fix validation errors before saving" : undefined}
          className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <p className="text-sm text-red-700">Failed to save settings. Please try again.</p>
        </div>
      )}

      {hasErrors && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <p className="text-sm text-amber-700">Please fix the validation errors below before saving.</p>
        </div>
      )}

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {grouped.map(g => {
              const groupHasErrors = g.items.some(i => fieldErrors[i.key]);
              return (
                <button
                  key={g.group}
                  onClick={() => setActiveGroup(g.group)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                    activeGroup === g.group
                      ? "bg-navy-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {groupLabels[g.group] ?? g.group}
                  {groupHasErrors && (
                    <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings form */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {currentGroup && (
            <>
              <h2 className="font-bold text-navy-900 mb-5">{groupLabels[currentGroup.group] ?? currentGroup.group}</h2>
              <div className="space-y-4">
                {currentGroup.items.map(item => {
                  const error = fieldErrors[item.key];
                  return (
                    <div key={item.key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        {item.label ?? item.key}
                      </label>
                      {item.type === "textarea" ? (
                        <textarea
                          value={values[item.key] ?? ""}
                          onChange={e => handleChange(item.key, item.type, e.target.value)}
                          rows={3}
                          className={`form-input resize-none ${error ? "border-red-400 focus:ring-red-300" : ""}`}
                        />
                      ) : item.type === "boolean" ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={values[item.key] === "true"}
                            onChange={e => handleChange(item.key, item.type, e.target.checked ? "true" : "false")}
                            className="h-4 w-4 rounded border-gray-300 text-navy-900"
                          />
                          <span className="text-sm text-gray-700">Enabled</span>
                        </label>
                      ) : (
                        <input
                          type={item.type === "url" ? "url" : "text"}
                          value={values[item.key] ?? ""}
                          onChange={e => handleChange(item.key, item.type, e.target.value)}
                          className={`form-input ${error ? "border-red-400 focus:ring-red-300" : ""}`}
                          placeholder={item.type === "url" ? "https://" : ""}
                        />
                      )}
                      {error && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          {error}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">{item.key}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
