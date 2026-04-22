// src/components/pages/contact-page-client.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@/lib/validations/booking";
import { z } from "zod";
import { Phone, Mail, MapPin, Clock, MessageCircle, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, useLanguage } from "@/lib/i18n/context";

type ContactValues = z.infer<typeof contactSchema>;

interface ContactPageClientProps {
  phone: string;
  email: string;
  address: string;
  whatsappNumber: string;
  businessName: string;
}

export function ContactPageClient({
  phone,
  email,
  address,
  whatsappNumber,
  businessName,
}: ContactPageClientProps) {
  const t = useT();
  const { locale } = useLanguage();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: ContactValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      setSent(true);
      reset();
    } catch {
      setServerError(locale === "al" ? "Dërgimi dështoi. Ju lutemi provoni përsëri ose na kontaktoni direkt." : "Failed to send message. Please try again or contact us directly.");
    }
  };

  const contactInfo = [
    { icon: Phone, label: locale === "al" ? "Telefon / WhatsApp" : "Phone / WhatsApp", value: phone, href: `tel:${phone.replace(/\s+/g, "")}` },
    { icon: Mail, label: locale === "al" ? "Email" : "Email", value: email, href: `mailto:${email}` },
    { icon: MapPin, label: locale === "al" ? "Adresa" : "Office Address", value: address },
    { icon: Clock, label: locale === "al" ? "Oraret" : "Support Hours", value: locale === "al" ? "24 orë në ditë, 7 ditë në javë" : "24 hours a day, 7 days a week" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-900 py-16">
        <div className="page-container text-center">
          <h1 className="font-display text-4xl font-bold text-white mb-3">{t.contactFaq.contactTitle}</h1>
          <p className="text-gray-400 text-lg">{t.contactFaq.contactSubtitle}</p>
        </div>
      </div>

      <div className="page-container py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-2xl text-navy-900 mb-6">{locale === "al" ? "Informacioni i Kontaktit" : "Contact Information"}</h2>
              <div className="space-y-4">
                {contactInfo.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="h-10 w-10 bg-navy-50 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-navy-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                      {href ? (
                        <a href={href} className="font-medium text-navy-900 hover:text-crimson-500 transition-colors">{value}</a>
                      ) : (
                        <p className="font-medium text-navy-900">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(locale === "al" ? `Përshëndetje ${businessName}! Kam një pyetje.` : `Hello ${businessName}! I have a question.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-5 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors"
            >
              <MessageCircle className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-bold">{locale === "al" ? "Bisedoni në WhatsApp" : "Chat on WhatsApp"}</p>
                <p className="text-sm text-green-100">{locale === "al" ? "Përgjigje e menjëhershme — i disponueshëm 24/7" : "Instant response — available 24/7"}</p>
              </div>
            </a>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            <h2 className="font-bold text-xl text-navy-900 mb-5">{locale === "al" ? "Na Dërgoni një Mesazh" : "Send us a message"}</h2>

            {sent ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="font-bold text-navy-900 mb-2">{t.contactFaq.successMessage}</h3>
                <p className="text-gray-600 text-sm">{locale === "al" ? "Do t'ju kthehemi sa më shpejt të jetë e mundur." : "We'll get back to you as soon as possible."}</p>
                <button onClick={() => setSent(false)} className="mt-5 text-crimson-500 text-sm hover:underline">
                  {locale === "al" ? "Dërgo një mesazh tjetër" : "Send another message"}
                </button>
              </div>
            ) : (
              <>
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">{serverError}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t.contactFaq.name} *</label>
                      <input type="text" placeholder="Your name" className={cn("form-input", errors.name && "border-red-400")} {...register("name")} />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t.contactFaq.email} *</label>
                      <input type="email" placeholder="your@email.com" className={cn("form-input", errors.email && "border-red-400")} {...register("email")} />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t.contactFaq.phone}</label>
                    <input type="tel" placeholder="+383 44 000 000" className="form-input" {...register("phone")} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t.contactFaq.subject}</label>
                    <input type="text" placeholder="How can we help?" className="form-input" {...register("subject")} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{t.contactFaq.message} *</label>
                    <textarea rows={4} placeholder="Your message..." className={cn("form-input resize-none", errors.message && "border-red-400")} {...register("message")} />
                    {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {locale === "al" ? "Duke dërguar..." : "Sending..."}</> : t.contactFaq.sendMessage}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
