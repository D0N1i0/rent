"use client";
// src/components/pages/insurance-client.tsx
// Client component for the Insurance page — handles AL/EN content.

import Link from "next/link";
import { Shield, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export function InsuranceClient() {
  const { locale } = useLanguage();
  const isAl = locale === "al";

  const content = {
    badge: isAl ? "Qetësia Juaj në Rrugë" : "Your Peace of Mind on the Road",
    heroTitle: isAl ? "Informacioni i Sigurimit" : "Insurance Information",
    heroSubtitle: isAl
      ? "Çdo qira AutoKos përfshin sigurim të detyrueshëm. Ja saktësisht çfarë mbulohet."
      : "Every AutoKos rental includes mandatory insurance. Here's exactly what's covered.",
    includedHeading: isAl ? "Gjithmonë i Përfshirë — Falas" : "Always Included — Free",
    included: isAl
      ? [
          { title: "Përgjegjësia ndaj Palëve të Treta (TPL)", desc: "Mbulon dëmin ose lëndimin e shkaktuar palëve të treta. Kërkohet nga ligji i Kosovës. Përfshirë në çdo qira pa kosto shtesë." },
          { title: "Mbulimi ndaj Zjarrit & Vjedhjes", desc: "Mbulon humbjen totale të automjetit për shkak të zjarrit ose vjedhjes. Kushtet zbatohen — referojuni marrëveshjes së qirasë." },
          { title: "Asistencë Rrugore", desc: "Asistencë bazë rrugore e përfshirë. Telefononi linjën tonë të mbështetjes 24/7 nëse përjetoni prishje." },
          { title: "Mbulim Ligjor Minimal", desc: "Të gjitha automjetet plotësojnë kërkesat minimale ligjore të sigurimit të Kosovës. Jeni gjithmonë të mbrojtur ligjërisht." },
        ]
      : [
          { title: "Third-Party Liability (TPL)", desc: "Covers damage or injury caused to third parties. Required by Kosovo law. Included in every rental at no extra cost." },
          { title: "Fire & Theft Cover", desc: "Covers total loss of the vehicle due to fire or theft. Conditions apply — refer to the rental agreement." },
          { title: "Roadside Assistance", desc: "Basic roadside assistance included. Call our 24/7 support line if you experience a breakdown." },
          { title: "Legal Minimum Cover", desc: "All vehicles meet Kosovo's minimum legal insurance requirements. You are always legally protected." },
        ],
    optionalHeading: isAl ? "Opsione Shtesë" : "Optional Upgrades",
    cdwTitle: isAl ? "Heqja Dorë nga Dëmtimi i Goditjes (CDW)" : "Collision Damage Waiver (CDW)",
    cdwDesc: isAl
      ? "Zvogëlon përgjegjësinë tuaj për dëmtimin e makinës me qira. Paguani vetëm një zbritje të reduktuar (tepricë) nëse makina dëmtohet."
      : "Reduces your liability for damage to the rental car. You pay only a reduced deductible (excess) if the car is damaged.",
    cdwItems: isAl
      ? ["Zbritje e reduktuar dëmtimi", "Mbulon shumicën e dëmtimeve aksidentale", "Përjashton gomat, qelqin, fundin e automjetit"]
      : ["Reduced damage deductible", "Covers most accidental damage", "Excludes tyres, glass, underbody"],
    fullCovTitle: isAl ? "Mbulim i Plotë (Zero Tepricë)" : "Full Coverage (Zero Excess)",
    fullCovDesc: isAl
      ? "Qetësi e plotë mendore. Zero tepricë për të gjitha dëmtimet duke përfshirë gomat, qelqin dhe fundin. Pa zbritje, pa surpriza."
      : "Complete peace of mind. Zero excess on all damage including tyres, glass, and underbody. No deductible, no surprises.",
    fullCovItems: isAl
      ? ["Zero zbritje për të gjitha dëmtimet", "Gomat, qelqi & fundi i mbuluar", "Asnjë depozitë e mbajtur për dëm"]
      : ["Zero deductible on all damage", "Tyres, glass & underbody covered", "No deposit withheld for damage"],
    exclusionsHeading: isAl ? "Përjashtimet (Mbulimi Standard)" : "Exclusions (Standard Cover)",
    exclusions: isAl
      ? [
          "Dëmtim gjatë ngasjes nën ndikimin e alkoolit ose drogës",
          "Dëmtim i shkaktuar nga ngasja e pakujdesshme ose e qëllimshme",
          "Humbja e sendeve personale nga automjeti",
          "Dëmtim i automjeteve të tjera nën kujdesin tuaj",
          "Udhëtimi ndërkufitar pa miratim paraprak",
          "Përdorim për motorsport, gara ose jashtë rrugës",
        ]
      : [
          "Damage while driving under influence of alcohol or drugs",
          "Damage caused by reckless or deliberate driving",
          "Loss of personal belongings from the vehicle",
          "Damage to other vehicles in your care",
          "Cross-border travel without prior approval",
          "Use for motorsport, racing, or off-road",
        ],
    importantNoteTitle: isAl ? "Shënim i Rëndësishëm" : "Important Note",
    importantNote: isAl
      ? "I gjithë sigurimi i nënshtrohet kushteve të plota në marrëveshjen tuaj të qirasë. Ju lutemi lexoni me kujdes para nënshkrimit. Nëse keni pyetje, ekipi ynë do të ketë kënaqësinë t'i shpjegojë në shqip ose anglisht."
      : "All insurance is subject to the full terms in your rental agreement. Please read carefully before signing. If you have any questions, our team will be happy to explain in English or Albanian.",
    ctaButton: isAl ? "Shfleto Makinat & Rezervo Tani" : "Browse Cars & Book Now",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-900 py-16">
        <div className="page-container text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-5">
            <Shield className="h-4 w-4 text-green-400" />
            {content.badge}
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-3">{content.heroTitle}</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">{content.heroSubtitle}</p>
        </div>
      </div>

      <div className="page-container py-12 max-w-4xl mx-auto space-y-6">
        {/* Included */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="font-bold text-xl text-navy-900">{content.includedHeading}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {content.included.map(({ title, desc }) => (
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
            <h2 className="font-bold text-xl text-navy-900">{content.optionalHeading}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border-2 border-blue-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-navy-900">{content.cdwTitle}</p>
                <span className="text-sm font-bold text-blue-600">+€8/day</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{content.cdwDesc}</p>
              <ul className="space-y-1.5">
                {content.cdwItems.map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-2 border-crimson-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-navy-900">{content.fullCovTitle}</p>
                <span className="text-sm font-bold text-crimson-600">+€12/day</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{content.fullCovDesc}</p>
              <ul className="space-y-1.5">
                {content.fullCovItems.map(item => (
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
            <h2 className="font-bold text-xl text-navy-900">{content.exclusionsHeading}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {content.exclusions.map(item => (
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
            <p className="font-semibold text-amber-900 text-sm mb-1">{content.importantNoteTitle}</p>
            <p className="text-sm text-amber-800">{content.importantNote}</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/fleet" className="btn-primary text-base px-8 py-3.5">
            {content.ctaButton} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
