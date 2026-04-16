// src/app/(public)/long-term/page.tsx
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, CheckCircle2, ArrowRight, Star, Phone } from "lucide-react";
import { getPublicSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "long-term" } });
  return {
    title: seo?.title ?? "Monthly & Long-Term Car Rental Kosovo",
    description: seo?.description ?? "Long-term car rentals in Kosovo from 30 days. Unlimited mileage, flexible terms, corporate options available.",
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Monthly & Long-Term Car Rental Kosovo",
      description: seo?.ogDescription ?? seo?.description ?? "Long-term car rentals in Kosovo from 30 days. Unlimited mileage, flexible terms, corporate options available.",
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function LongTermPage() {
  const settings = await getPublicSettings();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hero-gradient py-20">
        <div className="page-container">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-5">
              <Calendar className="h-4 w-4" />
              30 Days or More
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Long-Term Car Rental<br />
              <span className="text-crimson-400">Great Rates, Full Flexibility</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Need a car for a month or longer? Our long-term rental packages offer the best value, unlimited mileage, and full flexibility — ideal for expats, business travellers, and extended stays.
            </p>
            <Link href="/fleet" className="btn-primary text-base px-6 py-3.5">
              Get Monthly Pricing <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <h2 className="section-heading text-center mb-10">Why Choose Long-Term Rental?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { title: "Up to 35% Cheaper", desc: "Monthly rates are significantly better than daily. The longer you rent, the more you save." },
              { title: "Unlimited Mileage", desc: "All monthly rentals include unlimited kilometres. Drive anywhere in Kosovo with no meter running." },
              { title: "Full Insurance", desc: "All standard insurance included. Optional full coverage available at a fixed monthly rate." },
              { title: "No Long Contracts", desc: "Flexible monthly terms. Extend easily or return early with reasonable notice (see policy)." },
              { title: "Free Servicing", desc: "For rentals over 3 months, we handle all routine servicing at no extra cost." },
              { title: "Corporate Options", desc: "Need multiple vehicles for your business? We offer corporate fleet solutions with invoicing." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <CheckCircle2 className="h-6 w-6 text-green-500 mb-3" />
                <h3 className="font-bold text-navy-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="page-container max-w-3xl mx-auto">
          <h2 className="section-heading text-center mb-10">Monthly Pricing Guide</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-navy-900 text-white">
                  <tr>
                    {["Category", "Daily Rate", "Weekly Rate", "Monthly Rate", "Savings"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-sm font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { category: "Economy", daily: 35, weekly: 210, monthly: 750, savings: "28%" },
                    { category: "Compact", daily: 50, weekly: 300, monthly: 1100, savings: "27%" },
                    { category: "Sedan", daily: 65, weekly: 390, monthly: 1400, savings: "28%" },
                    { category: "SUV", daily: 79, weekly: 474, monthly: 1700, savings: "28%" },
                    { category: "Premium", daily: 100, weekly: 600, monthly: 2200, savings: "27%" },
                    { category: "Family Van", daily: 95, weekly: 570, monthly: 2000, savings: "30%" },
                  ].map(row => (
                    <tr key={row.category} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-semibold text-navy-900 text-sm">{row.category}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">€{row.daily}/day</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">€{row.weekly}/wk</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-navy-900">€{row.monthly}/mo</td>
                      <td className="px-5 py-3.5">
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Save {row.savings}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">Prices are indicative. Final pricing depends on vehicle and rental period. Contact us for exact quotes.</p>
        </div>
      </section>

      <section className="py-12 hero-gradient">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Get a Custom Quote</h2>
          <p className="text-gray-300 mb-8">Tell us your dates and we'll find the best long-term deal for you.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/fleet" className="btn-primary text-base px-8 py-3.5">Browse Monthly Cars</Link>
            <a href={`https://wa.me/${settings.whatsappNumber}?text=Hello, I'm interested in a monthly car rental.`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3.5 rounded-md transition-colors">
              <Phone className="h-5 w-5" /> WhatsApp for Quote
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
