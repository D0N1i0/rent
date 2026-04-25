import Link from "next/link";
import { Phone, MessageCircle, Mail } from "lucide-react";
import type { PublicSettings } from "@/lib/settings";

export function ContactCta({
  content,
  settings,
  locale = "en",
}: {
  content: Record<string, string>;
  settings: PublicSettings;
  locale?: "en" | "al";
}) {
  const isAl = locale === "al";
  const title = content.contact_cta_title || (isAl ? "Gati të Niseni?" : "Ready to Hit the Road?");
  const description = content.contact_cta_description || (isAl
    ? `Rezervoni online në pak minuta ose kontaktoni ${settings.businessName} — jemi gjithmonë të lumtur t'ju ndihmojmë të gjeni makinën e duhur.`
    : `Book online in minutes or reach out to ${settings.businessName} — we are always happy to help you find the right car.`);
  const whatsappMessage = encodeURIComponent(
    content.contact_cta_whatsapp_message ||
    (isAl ? `Përshëndetje ${settings.businessName}! Dëshiroj të marr me qira një makinë.` : `Hello ${settings.businessName}! I'd like to rent a car.`)
  );

  const infoItems = [
    { label: isAl ? "Telefon / WhatsApp" : "Phone / WhatsApp", value: settings.phone, icon: Phone },
    { label: "Email", value: settings.supportEmail, icon: Mail },
    { label: isAl ? "I Hapur" : "Open", value: settings.supportLabel, icon: MessageCircle },
  ];

  return (
    <section className="py-20 hero-gradient">
      <div className="page-container text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">{title}</h2>
        <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">{description}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/fleet" className="btn-primary text-base px-8 py-3.5">
            {isAl ? "Shfletoni Flotilën Tonë" : "Browse Our Fleet"}
          </Link>
          <a
            href={`https://wa.me/${settings.whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3.5 rounded-md transition-colors text-base"
          >
            <MessageCircle className="h-5 w-5" />
            {isAl ? "Bisedë WhatsApp" : "WhatsApp Chat"}
          </a>
          <a
            href={`tel:${settings.phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-md transition-colors border border-white/20 text-base"
          >
            <Phone className="h-5 w-5" />
            {isAl ? "Telefononi" : "Call Us"}
          </a>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {infoItems.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon className="h-5 w-5 text-crimson-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-white font-semibold text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
