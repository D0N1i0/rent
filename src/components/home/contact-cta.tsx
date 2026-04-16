import Link from "next/link";
import { Phone, MessageCircle, Mail } from "lucide-react";
import type { PublicSettings } from "@/lib/settings";

export function ContactCta({ content, settings }: { content: Record<string, string>; settings: PublicSettings }) {
  const title = content.contact_cta_title || "Ready to Hit the Road?";
  const description = content.contact_cta_description || `Book online in minutes or reach out to ${settings.businessName} — we are always happy to help you find the right car.`;
  const whatsappMessage = encodeURIComponent(content.contact_cta_whatsapp_message || `Hello ${settings.businessName}! I'd like to rent a car.`);
  return (
    <section className="py-20 hero-gradient">
      <div className="page-container text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">{title}</h2>
        <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">{description}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/fleet" className="btn-primary text-base px-8 py-3.5">Browse Our Fleet</Link>
          <a href={`https://wa.me/${settings.whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3.5 rounded-md transition-colors text-base"><MessageCircle className="h-5 w-5" />WhatsApp Chat</a>
          <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-md transition-colors border border-white/20 text-base"><Phone className="h-5 w-5" />Call Us</a>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[{ label: "Phone / WhatsApp", value: settings.phone, icon: Phone }, { label: "Email", value: settings.supportEmail, icon: Mail }, { label: "Open", value: settings.supportLabel, icon: MessageCircle }].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center"><Icon className="h-5 w-5 text-crimson-400 mx-auto mb-2" /><p className="text-xs text-gray-400">{label}</p><p className="text-white font-semibold text-sm">{value}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}
