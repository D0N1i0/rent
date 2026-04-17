"use client";
// src/components/pages/airport-rental-client.tsx
// Client component for the Airport Rental page — handles AL/EN content.

import Link from "next/link";
import { Plane, Clock, MapPin, Phone, Check, ArrowRight, Shield, Star } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

type Props = {
  whatsappNumber: string;
};

export function AirportRentalClient({ whatsappNumber }: Props) {
  const { locale } = useLanguage();
  const isAl = locale === "al";

  const content = {
    badge: isAl ? "Aeroporti Ndërkombëtar i Prishtinës" : "Prishtina International Airport",
    heroTitle: isAl ? "Marrje Makine nga Aeroporti" : "Airport Car Rental",
    heroTitleHighlight: isAl ? "Bërë Si Duhet" : "Done Right",
    heroSubtitle: isAl
      ? "Zbrisni në Aeroportin e Prishtinës dhe nisuni brenda minutave. Agjenti ynë ju pret në sallën e mbërrjeve me një shenjë me emrin tuaj — pa kërkim, pa pritje, pa stres. I disponueshëm 24/7, 365 ditë në vit."
      : "Land at Prishtina Airport and drive away within minutes. Our agent meets you in the arrivals hall with a name sign — no searching, no waiting, no stress. Available 24/7, 365 days a year.",
    bookButton: isAl ? "Rezervo Marrje nga Aeroporti" : "Book Airport Pickup",
    howItWorksHeading: isAl ? "Si Funksionon Marrja nga Aeroporti" : "How Airport Pickup Works",
    steps: isAl
      ? [
          { step: "01", title: "Rezervo Online", desc: "Zgjidh 'Aeroportin e Prishtinës' si vendndodhjen e marrjes kur shfleton flotën tonë. Zgjidh datat dhe konfirmo rezervimin." },
          { step: "02", title: "Merr Konfirmimin", desc: "Merr konfirmim të menjëhershëm rezervimi me email dhe WhatsApp me të gjitha detajet duke përfshirë numrin e kontaktit të agjentit tuaj." },
          { step: "03", title: "Zbrit & Mblidh", desc: "Agjenti ynë do të jetë në sallën e mbërrjeve me emrin tënd në shenjë. Trego referencën e rezervimit dhe pasaportën." },
          { step: "04", title: "Nisi", desc: "Nënshkruaj marrëveshjen e shkurtër të qirasë, dorëzo kartën e depozitës dhe je gati të eksploroësh Kosovën." },
        ]
      : [
          { step: "01", title: "Book Online", desc: "Select 'Prishtina Airport' as your pickup location when browsing our fleet. Choose your dates and confirm your booking." },
          { step: "02", title: "Receive Confirmation", desc: "Get instant booking confirmation by email and WhatsApp with all details including your agent's contact number." },
          { step: "03", title: "Land & Collect", desc: "Our agent will be in the arrivals hall with your name on a sign. Show your booking reference and passport." },
          { step: "04", title: "Drive Away", desc: "Sign the brief rental agreement, hand over your deposit card, and you're ready to explore Kosovo." },
        ],
    serviceDetailsHeading: isAl ? "Detajet e Shërbimit" : "Airport Service Details",
    details: isAl
      ? [
          { icon: Plane, label: "Aeroporti", value: "Aeroporti Ndërkombëtar i Prishtinës Adem Jashari (PRN)" },
          { icon: MapPin, label: "Pika e Takimit", value: "Salla e Mbërrjeve — agjenti ynë do të ketë emrin tuaj në shenjë" },
          { icon: Clock, label: "Disponueshmëria", value: "24 orë në ditë, 7 ditë në javë, gjatë gjithë vitit" },
          { icon: Shield, label: "Tarifa e Aeroportit", value: "€15 për drejtim (marrje ose lëshim)" },
          { icon: Star, label: "Meet & Greet", value: "+€20 njëherë — agjent me shenjë emri në sallën e mbërrjeve" },
        ]
      : [
          { icon: Plane, label: "Airport", value: "Prishtina International Airport Adem Jashari (PRN)" },
          { icon: MapPin, label: "Meeting Point", value: "Arrivals Hall — our agent will have your name on a sign" },
          { icon: Clock, label: "Availability", value: "24 hours a day, 7 days a week, all year round" },
          { icon: Shield, label: "Airport Fee", value: "€15 per direction (pickup or drop-off)" },
          { icon: Star, label: "Meet & Greet", value: "+€20 one-time — agent with name sign in arrivals hall" },
        ],
    pickupBoxHeading: isAl ? "Çfarë të Keni Gati në Marrje" : "What to Have Ready at Pickup",
    pickupItems: isAl
      ? [
          "Referenca e rezervimit tuaj (email ose pamje ekrani)",
          "Pasaportë e vlefshme ose kartë identiteti kombëtare",
          "Patent origjinale",
          "Kartë krediti ose debiti për depozitën e sigurisë",
          "Leje Ndërkombëtare Ngasje (nëse patenta juaj nuk është e BE-së)",
        ]
      : [
          "Your booking reference (email or screenshot)",
          "Valid passport or national identity card",
          "Original driving licence",
          "Credit or debit card for the security deposit",
          "International Driving Permit (if your licence is non-EU)",
        ],
    lateNote: isAl ? "Po mbërrini natën vonë ose shumë herët?" : "Arriving late night or very early?",
    lateLink: isAl ? "→ Na dërgoni mesazh në WhatsApp — jemi gjithmonë të zgjuar" : "→ Message us on WhatsApp — we're always awake",
    ctaHeading: isAl ? "Gati për të Rezervuar Makinën tuaj në Aeroport?" : "Ready to Book Your Airport Car?",
    ctaSubtitle: isAl
      ? "Shfletoni flotën tonë dhe zgjidhni 'Aeroportin e Prishtinës' si pikën tuaj të marrjes."
      : "Browse our fleet and select 'Prishtina Airport' as your pickup point.",
    ctaButton: isAl ? "Shfleto Flotën & Rezervo Tani" : "Browse Fleet & Book Now",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="hero-gradient py-20">
        <div className="page-container">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-5">
              <Plane className="h-4 w-4 text-white" />
              {content.badge}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              {content.heroTitle}<br />
              <span className="text-crimson-400">{content.heroTitleHighlight}</span>
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">{content.heroSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/fleet" className="btn-primary text-base px-6 py-3.5">
                {content.bookButton} <ArrowRight className="h-5 w-5" />
              </Link>
              <a href={`https://wa.me/${whatsappNumber}?text=Hello, I need airport pickup car rental.`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3.5 rounded-md transition-colors">
                <Phone className="h-5 w-5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <h2 className="section-heading text-center mb-10">{content.howItWorksHeading}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {content.steps.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="h-12 w-12 bg-navy-900 rounded-xl flex items-center justify-center text-white font-bold text-sm mx-auto mb-3">{step}</div>
                <h3 className="font-bold text-navy-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Airport info */}
      <section className="py-16 bg-gray-50">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-10 items-start max-w-4xl mx-auto">
            <div>
              <h2 className="section-heading mb-5">{content.serviceDetailsHeading}</h2>
              <div className="space-y-4">
                {content.details.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-crimson-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-medium text-navy-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-navy-900 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-4">{content.pickupBoxHeading}</h3>
              <ul className="space-y-3">
                {content.pickupItems.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-5 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-3">{content.lateNote}</p>
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-green-400 font-semibold text-sm hover:text-green-300 transition-colors">
                  {content.lateLink}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 hero-gradient">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-3">{content.ctaHeading}</h2>
          <p className="text-gray-300 mb-8">{content.ctaSubtitle}</p>
          <Link href="/fleet" className="btn-primary text-base px-8 py-3.5">
            {content.ctaButton}
          </Link>
        </div>
      </section>
    </div>
  );
}
