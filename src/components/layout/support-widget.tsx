// src/components/layout/support-widget.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, X, Phone, Mail, MessageSquare, Loader2, CheckCircle, Bug, Lightbulb } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const quickSchema = z.object({
  type: z.enum(["COMPLAINT", "SUGGESTION", "BUG_REPORT", "OTHER"]),
  subject: z.string().min(2, "Subject required").max(200),
  message: z.string().min(5, "Message required").max(1000),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

interface SupportWidgetProps {
  whatsappNumber?: string;
  phone?: string;
  supportEmail?: string;
}

export function SupportWidget({ whatsappNumber = "", phone = "", supportEmail = "" }: SupportWidgetProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "report" | "done">("menu");
  const [type, setType] = useState<"COMPLAINT" | "SUGGESTION" | "BUG_REPORT" | "OTHER">("OTHER");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = async () => {
    const parsed = quickSchema.safeParse({ type, subject, message, email: email || undefined });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((e) => { if (e.path[0]) errs[String(e.path[0])] = e.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, message, email: email || undefined }),
      });
      setView("done");
    } catch {
      setErrors({ message: "Failed to send. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => { setView("menu"); setSubject(""); setMessage(""); setEmail(""); setErrors({}); }, 300);
  };

  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hello AutoKos, I need help with my rental.")}`
    : null;

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Panel */}
      {open && (
        <div className={cn(
          "bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 overflow-hidden transition-all",
          "animate-in slide-in-from-bottom-4 duration-200"
        )}>
          {/* Header */}
          <div className="bg-navy-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-white" />
              <span className="text-white font-semibold text-sm">Help & Support</span>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {view === "menu" && (
            <div className="p-4 space-y-2">
              <p className="text-xs text-gray-500 mb-3">How can we help you today?</p>

              {/* Quick contact options */}
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
                >
                  <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-green-800">WhatsApp Chat</p>
                    <p className="text-xs text-green-600">Usually replies in minutes</p>
                  </div>
                </a>
              )}

              {phone && (
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-blue-800">Call Us</p>
                    <p className="text-xs text-blue-600">{phone}</p>
                  </div>
                </a>
              )}

              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="h-8 w-8 bg-gray-600 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Email Support</p>
                    <p className="text-xs text-gray-500">{supportEmail}</p>
                  </div>
                </a>
              )}

              <div className="border-t border-gray-100 pt-2 space-y-1.5">
                <button
                  onClick={() => setView("report")}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left border border-gray-200"
                >
                  <div className="h-8 w-8 bg-crimson-500 rounded-lg flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Report a Problem</p>
                    <p className="text-xs text-gray-500">Send us a detailed report</p>
                  </div>
                </button>

                <Link
                  href="/feedback"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Submit Feedback</p>
                    <p className="text-xs text-gray-500">Suggestions, complaints, ideas</p>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {view === "report" && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setView("menu")} className="text-xs text-gray-400 hover:text-navy-900">← Back</button>
                <p className="text-sm font-semibold text-navy-900">Report a Problem</p>
              </div>

              {/* Type */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "BUG_REPORT" as const, label: "Bug", icon: <Bug className="h-3.5 w-3.5" /> },
                  { v: "COMPLAINT" as const, label: "Complaint", icon: <MessageSquare className="h-3.5 w-3.5" /> },
                  { v: "SUGGESTION" as const, label: "Idea", icon: <Lightbulb className="h-3.5 w-3.5" /> },
                  { v: "OTHER" as const, label: "Other", icon: <MessageCircle className="h-3.5 w-3.5" /> },
                ]).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setType(opt.v)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all",
                      type === opt.v ? "border-navy-900 bg-navy-50 text-navy-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Subject *"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={cn("form-input text-sm", errors.subject && "border-red-400")}
                />
                {errors.subject && <p className="text-xs text-red-500 mt-0.5">{errors.subject}</p>}
              </div>
              <div>
                <textarea
                  placeholder="Describe the issue... *"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className={cn("form-input resize-none text-sm", errors.message && "border-red-400")}
                />
                {errors.message && <p className="text-xs text-red-500 mt-0.5">{errors.message}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("form-input text-sm", errors.email && "border-red-400")}
                />
                {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Send Report"}
              </button>
            </div>
          )}

          {view === "done" && (
            <div className="p-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-navy-900 mb-1">Report Received!</p>
              <p className="text-sm text-gray-500 mb-4">We'll look into this shortly. Thank you.</p>
              <button onClick={handleClose} className="btn-secondary text-sm px-4 py-2">Close</button>
            </div>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all",
          open ? "bg-gray-700 text-white" : "bg-navy-900 text-white hover:bg-navy-800"
        )}
        aria-label="Open support"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
