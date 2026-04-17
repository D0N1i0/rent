"use client";
// src/components/pages/about-client.tsx
// Client component for the About page — handles AL/EN content.

import Link from "next/link";
import { Shield, Star, Users, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export function AboutClient() {
  const { locale } = useLanguage();
  const isAl = locale === "al";

  const content = {
    heroTitle: isAl
      ? "Shërbimi Më i Besuar i Marrjes me Qira në Kosovë"
      : "Kosovo's Most Trusted\nCar Rental Service",
    heroSubtitle: isAl
      ? "Themeluar në Prishtinë, AutoKos ka ndihmuar banorët lokalë, turistët dhe diasporën të eksplorojnë Kosovën me besim që nga dita e parë."
      : "Founded in Prishtina, AutoKos has been helping locals, tourists, and diaspora explore Kosovo with confidence since day one.",
    storyHeading: isAl ? "Historia Jonë" : "Our Story",
    storyP1: isAl
      ? "AutoKos lindi nga një frustrim i thjeshtë: marrja me qira e makinës në Kosovë duhet të jetë e lehtë, transparente dhe e besueshme. Filluan me një flotë të vogël automjetesh të besueshme dhe një premtim të thjeshtë — pa surpriza, pa tarifa të fshehta, vetëm shërbim i shkëlqyer."
      : "AutoKos was born out of a simple frustration: renting a car in Kosovo should be easy, transparent, and trustworthy. We started with a small fleet of reliable vehicles and one simple promise — no surprises, no hidden fees, just great service.",
    storyP2: isAl
      ? "Sot, u shërbejmë qindra klientëve çdo muaj — nga turistët që mbërrijnë në Aeroportin e Prishtinës te udhëtarët e biznesit, diaspora kthyese dhe banorët lokalë që kanë nevojë për një automjet të besueshëm gjatë fundjavës."
      : "Today, we serve hundreds of customers every month — from tourists arriving at Prishtina Airport to business travellers, returning diaspora, and locals who need a reliable vehicle for a weekend.",
    storyP3: isAl
      ? "Çdo makinë në flotën tonë mirëmbahet rregullisht, është e siguruar plotësisht dhe pastrohet para çdo marrje me qira. Besojmë se udhëtimi juaj fillon në momentin kur merrni çelësat."
      : "Every car in our fleet is regularly maintained, fully insured, and cleaned before every rental. We believe that your journey starts the moment you pick up the keys.",
    stats: isAl
      ? [
          { icon: Shield, label: "Flotë e Siguruar", desc: "Çdo makinë plotësisht e mbuluar" },
          { icon: Star, label: "Shërbim 5★", desc: "Vlerësuar nga 500+ klientë" },
          { icon: Users, label: "Të Gjithë Klientët", desc: "Lokalë, turistë & diaspora" },
          { icon: MapPin, label: "7 Lokacione", desc: "Nëpër të gjithë Kosovën" },
        ]
      : [
          { icon: Shield, label: "Insured Fleet", desc: "Every car fully covered" },
          { icon: Star, label: "5★ Service", desc: "Rated by 500+ customers" },
          { icon: Users, label: "All Customers", desc: "Locals, tourists & diaspora" },
          { icon: MapPin, label: "7 Locations", desc: "Across all Kosovo" },
        ],
    commitmentsHeading: isAl ? "Angazhimet Tona" : "Our Commitments",
    commitments: isAl
      ? [
          "Çmime transparente — pa surpriza në marrje",
          "Të gjitha automjetet mirëmbahen dhe pastrohen para çdo marrje",
          "Mbështetje 24/7 me telefon dhe WhatsApp",
          "Marrje fleksibël nga Aeroporti i Prishtinës çdo kohë",
          "Anulim falas deri 48 orë para marrjes",
          "Flotë e re — të gjitha makinat nën 3 vjet",
        ]
      : [
          "Transparent pricing — no surprises at pickup",
          "All vehicles serviced and cleaned before every rental",
          "24/7 phone and WhatsApp support",
          "Flexible pickup from Prishtina Airport anytime",
          "Free cancellation up to 48 hours before pickup",
          "New fleet — all cars under 3 years old",
        ],
    ctaHeading: isAl ? "Gati për të Drejtuar?" : "Ready to Drive?",
    ctaSubtitle: isAl
      ? "Shfletoni flotën tonë dhe rezervoni makinën tuaj brenda minutave."
      : "Browse our fleet and book your car in minutes.",
    ctaButton: isAl ? "Shiko Flotën Tonë" : "See Our Fleet",
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="hero-gradient py-20">
        <div className="page-container text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 whitespace-pre-line">
            {content.heroTitle}
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">{content.heroSubtitle}</p>
        </div>
      </div>

      {/* Story */}
      <section className="py-16 bg-white">
        <div className="page-container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-heading mb-4">{content.storyHeading}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{content.storyP1}</p>
              <p className="text-gray-600 leading-relaxed mb-4">{content.storyP2}</p>
              <p className="text-gray-600 leading-relaxed">{content.storyP3}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {content.stats.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                  <Icon className="h-6 w-6 text-crimson-500 mx-auto mb-2" />
                  <p className="font-bold text-navy-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="page-container">
          <h2 className="section-heading text-center mb-10">{content.commitmentsHeading}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {content.commitments.map(item => (
              <div key={item} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 hero-gradient">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">{content.ctaHeading}</h2>
          <p className="text-gray-300 mb-8">{content.ctaSubtitle}</p>
          <Link href="/fleet" className="btn-primary text-base px-8 py-3.5">
            {content.ctaButton} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
