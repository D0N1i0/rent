// src/app/(public)/about/page.tsx
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Star, Users, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "about" } });
  return {
    title: seo?.title ?? "About Us",
    description: seo?.description ?? "Learn about AutoKos, Kosovo's most trusted car rental company based in Prishtina.",
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "About Us",
      description: seo?.ogDescription ?? seo?.description ?? "Learn about AutoKos, Kosovo's most trusted car rental company based in Prishtina.",
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="hero-gradient py-20">
        <div className="page-container text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Kosovo's Most Trusted<br />Car Rental Service
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Founded in Prishtina, AutoKos has been helping locals, tourists, and diaspora explore Kosovo with confidence since day one.
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="py-16 bg-white">
        <div className="page-container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-heading mb-4">Our Story</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                AutoKos was born out of a simple frustration: renting a car in Kosovo should be easy, transparent, and trustworthy. We started with a small fleet of reliable vehicles and one simple promise — no surprises, no hidden fees, just great service.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Today, we serve hundreds of customers every month — from tourists arriving at Prishtina Airport to business travellers, returning diaspora, and locals who need a reliable vehicle for a weekend.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Every car in our fleet is regularly maintained, fully insured, and cleaned before every rental. We believe that your journey starts the moment you pick up the keys.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, label: "Insured Fleet", desc: "Every car fully covered" },
                { icon: Star, label: "5★ Service", desc: "Rated by 500+ customers" },
                { icon: Users, label: "All Customers", desc: "Locals, tourists & diaspora" },
                { icon: MapPin, label: "7 Locations", desc: "Across all Kosovo" },
              ].map(({ icon: Icon, label, desc }) => (
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
          <h2 className="section-heading text-center mb-10">Our Commitments</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              "Transparent pricing — no surprises at pickup",
              "All vehicles serviced and cleaned before every rental",
              "24/7 phone and WhatsApp support",
              "Flexible pickup from Prishtina Airport anytime",
              "Free cancellation up to 48 hours before pickup",
              "New fleet — all cars under 3 years old",
            ].map(item => (
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
          <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to Drive?</h2>
          <p className="text-gray-300 mb-8">Browse our fleet and book your car in minutes.</p>
          <Link href="/fleet" className="btn-primary text-base px-8 py-3.5">
            See Our Fleet <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
