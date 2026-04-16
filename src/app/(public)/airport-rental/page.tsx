// src/app/(public)/airport-rental/page.tsx
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { Plane, Clock, MapPin, Phone, Check, ArrowRight, Shield, Star } from "lucide-react";
import { getPublicSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "airport-rental" } });
  return {
    title: seo?.title ?? "Prishtina Airport Car Rental — Direct Arrivals Hall Pickup",
    description: seo?.description ?? "Rent a car directly from Prishtina Airport Adem Jashari. 24/7 meet & greet service. Pre-book online for instant confirmation.",
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Prishtina Airport Car Rental — Direct Arrivals Hall Pickup",
      description: seo?.ogDescription ?? seo?.description ?? "Rent a car directly from Prishtina Airport Adem Jashari. 24/7 meet & greet service. Pre-book online for instant confirmation.",
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function AirportRentalPage() {
  const settings = await getPublicSettings();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="hero-gradient py-20">
        <div className="page-container">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-5">
              <Plane className="h-4 w-4 text-white" />
              Prishtina International Airport
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Airport Car Rental<br />
              <span className="text-crimson-400">Done Right</span>
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Land at Prishtina Airport and drive away within minutes. Our agent meets you in the arrivals hall with a name sign — no searching, no waiting, no stress. Available 24/7, 365 days a year.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/fleet" className="btn-primary text-base px-6 py-3.5">
                Book Airport Pickup <ArrowRight className="h-5 w-5" />
              </Link>
              <a href={`https://wa.me/${settings.whatsappNumber}?text=Hello, I need airport pickup car rental.`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3.5 rounded-md transition-colors">
                <Phone className="h-5 w-5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <h2 className="section-heading text-center mb-10">How Airport Pickup Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Book Online", desc: "Select 'Prishtina Airport' as your pickup location when browsing our fleet. Choose your dates and confirm your booking." },
              { step: "02", title: "Receive Confirmation", desc: "Get instant booking confirmation by email and WhatsApp with all details including your agent's contact number." },
              { step: "03", title: "Land & Collect", desc: "Our agent will be in the arrivals hall with your name on a sign. Show your booking reference and passport." },
              { step: "04", title: "Drive Away", desc: "Sign the brief rental agreement, hand over your deposit card, and you're ready to explore Kosovo." },
            ].map(({ step, title, desc }) => (
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
              <h2 className="section-heading mb-5">Airport Service Details</h2>
              <div className="space-y-4">
                {[
                  { icon: Plane, label: "Airport", value: "Prishtina International Airport Adem Jashari (PRN)" },
                  { icon: MapPin, label: "Meeting Point", value: "Arrivals Hall — our agent will have your name on a sign" },
                  { icon: Clock, label: "Availability", value: "24 hours a day, 7 days a week, all year round" },
                  { icon: Shield, label: "Airport Fee", value: "€15 per direction (pickup or drop-off)" },
                  { icon: Star, label: "Meet & Greet", value: "+€20 one-time — agent with name sign in arrivals hall" },
                ].map(({ icon: Icon, label, value }) => (
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
              <h3 className="font-bold text-lg mb-4">What to Have Ready at Pickup</h3>
              <ul className="space-y-3">
                {[
                  "Your booking reference (email or screenshot)",
                  "Valid passport or national identity card",
                  "Original driving licence",
                  "Credit or debit card for the security deposit",
                  "International Driving Permit (if your licence is non-EU)",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-5 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-3">Arriving late night or very early?</p>
                <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-green-400 font-semibold text-sm hover:text-green-300 transition-colors">
                  → Message us on WhatsApp — we're always awake
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 hero-gradient">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Ready to Book Your Airport Car?</h2>
          <p className="text-gray-300 mb-8">Browse our fleet and select 'Prishtina Airport' as your pickup point.</p>
          <Link href="/fleet" className="btn-primary text-base px-8 py-3.5">
            Browse Fleet & Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}
