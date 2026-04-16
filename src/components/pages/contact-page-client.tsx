// src/components/pages/contact-page-client.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@/lib/validations/booking";
import { z } from "zod";
import { Phone, Mail, MapPin, Clock, MessageCircle, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
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
      setServerError("Failed to send message. Please try again or contact us directly.");
    }
  };

  const contactInfo = [
    { icon: Phone, label: "Phone / WhatsApp", value: phone, href: `tel:${phone.replace(/\s+/g, "")}` },
    { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    { icon: MapPin, label: "Office Address", value: address },
    { icon: Clock, label: "Support Hours", value: "24 hours a day, 7 days a week" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-900 py-16">
        <div className="page-container text-center">
          <h1 className="font-display text-4xl font-bold text-white mb-3">Get in Touch</h1>
          <p className="text-gray-400 text-lg">We&apos;re here 24/7. Reach out anytime.</p>
        </div>
      </div>

      <div className="page-container py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-2xl text-navy-900 mb-6">Contact Information</h2>
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
              href={`https://wa.me/${whatsappNumber}?text=Hello ${businessName}! I have a question.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-5 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors"
            >
              <MessageCircle className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-bold">Chat on WhatsApp</p>
                <p className="text-sm text-green-100">Instant response — available 24/7</p>
              </div>
            </a>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            <h2 className="font-bold text-xl text-navy-900 mb-5">Send us a Message</h2>

            {sent ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="font-bold text-navy-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600 text-sm">We&apos;ll get back to you as soon as possible.</p>
                <button onClick={() => setSent(false)} className="mt-5 text-crimson-500 text-sm hover:underline">
                  Send another message
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
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Name *</label>
                      <input type="text" placeholder="Your name" className={cn("form-input", errors.name && "border-red-400")} {...register("name")} />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email *</label>
                      <input type="email" placeholder="your@email.com" className={cn("form-input", errors.email && "border-red-400")} {...register("email")} />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phone</label>
                    <input type="tel" placeholder="+383 44 000 000" className="form-input" {...register("phone")} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Subject</label>
                    <input type="text" placeholder="How can we help?" className="form-input" {...register("subject")} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Message *</label>
                    <textarea rows={4} placeholder="Your message..." className={cn("form-input resize-none", errors.message && "border-red-400")} {...register("message")} />
                    {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Send Message"}
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
