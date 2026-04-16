// src/app/(public)/insurance/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoMetadata.findUnique({ where: { page: "insurance" } });
  return {
    title: seo?.title ?? "Insurance Coverage — AutoKos",
    description: seo?.description ?? "Learn about insurance coverage included with AutoKos car rentals in Kosovo.",
    openGraph: {
      title: seo?.ogTitle ?? seo?.title ?? "Insurance Coverage — AutoKos",
      description: seo?.ogDescription ?? seo?.description ?? undefined,
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
  };
}

export default function InsurancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-900 py-16">
        <div className="page-container text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-5">
            <Shield className="h-4 w-4 text-green-400" />
            Your Peace of Mind on the Road
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-3">Insurance Information</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Every AutoKos rental includes mandatory insurance. Here's exactly what's covered.
          </p>
        </div>
      </div>

      <div className="page-container py-12 max-w-4xl mx-auto space-y-6">
        {/* Included */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="font-bold text-xl text-navy-900">Always Included — Free</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Third-Party Liability (TPL)", desc: "Covers damage or injury caused to third parties. Required by Kosovo law. Included in every rental at no extra cost." },
              { title: "Fire & Theft Cover", desc: "Covers total loss of the vehicle due to fire or theft. Conditions apply — refer to the rental agreement." },
              { title: "Roadside Assistance", desc: "Basic roadside assistance included. Call our 24/7 support line if you experience a breakdown." },
              { title: "Legal Minimum Cover", desc: "All vehicles meet Kosovo's minimum legal insurance requirements. You are always legally protected." },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-navy-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional upgrades */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="font-bold text-xl text-navy-900">Optional Upgrades</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border-2 border-blue-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-navy-900">Collision Damage Waiver (CDW)</p>
                <span className="text-sm font-bold text-blue-600">+€8/day</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Reduces your liability for damage to the rental car. You pay only a reduced deductible (excess) if the car is damaged.</p>
              <ul className="space-y-1.5">
                {["Reduced damage deductible", "Covers most accidental damage", "Excludes tyres, glass, underbody"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-2 border-crimson-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-navy-900">Full Coverage (Zero Excess)</p>
                <span className="text-sm font-bold text-crimson-600">+€12/day</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Complete peace of mind. Zero excess on all damage including tyres, glass, and underbody. No deductible, no surprises.</p>
              <ul className="space-y-1.5">
                {["Zero deductible on all damage", "Tyres, glass & underbody covered", "No deposit withheld for damage"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-crimson-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Not covered */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="font-bold text-xl text-navy-900">Exclusions (Standard Cover)</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "Damage while driving under influence of alcohol or drugs",
              "Damage caused by reckless or deliberate driving",
              "Loss of personal belongings from the vehicle",
              "Damage to other vehicles in your care",
              "Cross-border travel without prior approval",
              "Use for motorsport, racing, or off-road",
            ].map(item => (
              <div key={item} className="flex items-start gap-2.5">
                <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm mb-1">Important Note</p>
            <p className="text-sm text-amber-800">All insurance is subject to the full terms in your rental agreement. Please read carefully before signing. If you have any questions, our team will be happy to explain in English or Albanian.</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/fleet" className="btn-primary text-base px-8 py-3.5">
            Browse Cars & Book Now <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
