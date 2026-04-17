"use client";
// src/components/pages/long-term-client.tsx
// Client component for the Long-Term Rental page — handles AL/EN content.

import Link from "next/link";
import { Calendar, CheckCircle2, ArrowRight, Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

type Props = {
  whatsappNumber: string;
};

export function LongTermClient({ whatsappNumber }: Props) {
  const { locale } = useLanguage();
  const isAl = locale === "al";

  const content = {
    badge: isAl ? "30 Ditë ose Më Shumë" : "30 Days or More",
    heroTitle: isAl ? "Qira Afatgjatë Makinash" : "Long-Term Car Rental",
    heroTitleHighlight: isAl ? "Çmime të Mira, Fleksibilitet i Plotë" : "Great Rates, Full Flexibility",
    heroSubtitle: isAl
      ? "Keni nevojë për makinë për një muaj ose më gjatë? Paketet tona të qirasë afatgjatë ofrojnë vlerën më të mirë, kilometrazh të pakufizuar dhe fleksibilitet të plotë — ideal për ekspatë, udhëtarë biznesi dhe qëndrime të zgjatura."
      : "Need a car for a month or longer? Our long-term rental packages offer the best value, unlimited mileage, and full flexibility — ideal for expats, business travellers, and extended stays.",
    getQuoteButton: isAl ? "Merr Çmimin Mujor" : "Get Monthly Pricing",
    benefitsHeading: isAl ? "Pse të Zgjidhni Qira Afatgjatë?" : "Why Choose Long-Term Rental?",
    benefits: isAl
      ? [
          { title: "Deri 35% Më Lirë", desc: "Çmimet mujore janë shumë më të mira se ato ditore. Sa më gjatë të merrni me qira, aq më shumë kurseni." },
          { title: "Kilometrazh i Pakufizuar", desc: "Të gjitha qiratë mujore përfshijnë kilometrazh të pakufizuar. Drejtoni kudo në Kosovë pa asnjë matës." },
          { title: "Sigurim i Plotë", desc: "Të gjitha sigurimet standarde të përfshira. Mbulim i plotë opsional me çmim fiks mujor." },
          { title: "Pa Kontrata të Gjata", desc: "Kushte fleksibël mujore. Zgjatni lehtë ose kthejeni herët me njoftim të arsyeshëm (shikoni politikën)." },
          { title: "Servisim Falas", desc: "Për qiratë mbi 3 muaj, ne kujdesemi për të gjitha servisimin rutinë pa kosto shtesë." },
          { title: "Opsione Korporative", desc: "Keni nevojë për shumë automjete për biznesin tuaj? Ofrojmë zgjidhje flote korporative me faturim." },
        ]
      : [
          { title: "Up to 35% Cheaper", desc: "Monthly rates are significantly better than daily. The longer you rent, the more you save." },
          { title: "Unlimited Mileage", desc: "All monthly rentals include unlimited kilometres. Drive anywhere in Kosovo with no meter running." },
          { title: "Full Insurance", desc: "All standard insurance included. Optional full coverage available at a fixed monthly rate." },
          { title: "No Long Contracts", desc: "Flexible monthly terms. Extend easily or return early with reasonable notice (see policy)." },
          { title: "Free Servicing", desc: "For rentals over 3 months, we handle all routine servicing at no extra cost." },
          { title: "Corporate Options", desc: "Need multiple vehicles for your business? We offer corporate fleet solutions with invoicing." },
        ],
    pricingHeading: isAl ? "Udhëzues i Çmimeve Mujore" : "Monthly Pricing Guide",
    tableHeaders: isAl
      ? ["Kategoria", "Çmimi Ditor", "Çmimi Javor", "Çmimi Mujor", "Kursime"]
      : ["Category", "Daily Rate", "Weekly Rate", "Monthly Rate", "Savings"],
    pricingRows: [
      { category: isAl ? "Ekonomike" : "Economy", daily: 35, weekly: 210, monthly: 750, savings: "28%" },
      { category: isAl ? "Kompakte" : "Compact", daily: 50, weekly: 300, monthly: 1100, savings: "27%" },
      { category: isAl ? "Sedane" : "Sedan", daily: 65, weekly: 390, monthly: 1400, savings: "28%" },
      { category: "SUV", daily: 79, weekly: 474, monthly: 1700, savings: "28%" },
      { category: isAl ? "Premium" : "Premium", daily: 100, weekly: 600, monthly: 2200, savings: "27%" },
      { category: isAl ? "Van Familjar" : "Family Van", daily: 95, weekly: 570, monthly: 2000, savings: "30%" },
    ],
    pricingNote: isAl
      ? "Çmimet janë orientuese. Çmimi final varet nga automjeti dhe periudha e qirasë. Na kontaktoni për ofertat ekzakte."
      : "Prices are indicative. Final pricing depends on vehicle and rental period. Contact us for exact quotes.",
    saveLabel: isAl ? "Kursej" : "Save",
    ctaHeading: isAl ? "Merr një Ofertë të Personalizuar" : "Get a Custom Quote",
    ctaSubtitle: isAl
      ? "Na tregoni datat tuaja dhe ne do të gjejmë ofertën më të mirë afatgjatë për ju."
      : "Tell us your dates and we'll find the best long-term deal for you.",
    browseCarsButton: isAl ? "Shfleto Makinat Mujore" : "Browse Monthly Cars",
    whatsappButton: isAl ? "WhatsApp për Ofertë" : "WhatsApp for Quote",
    dayLabel: isAl ? "/ditë" : "/day",
    weekLabel: isAl ? "/javë" : "/wk",
    monthLabel: isAl ? "/muaj" : "/mo",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hero-gradient py-20">
        <div className="page-container">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-5">
              <Calendar className="h-4 w-4" />
              {content.badge}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              {content.heroTitle}<br />
              <span className="text-crimson-400">{content.heroTitleHighlight}</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8">{content.heroSubtitle}</p>
            <Link href="/fleet" className="btn-primary text-base px-6 py-3.5">
              {content.getQuoteButton} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <h2 className="section-heading text-center mb-10">{content.benefitsHeading}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {content.benefits.map(({ title, desc }) => (
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
          <h2 className="section-heading text-center mb-10">{content.pricingHeading}</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-navy-900 text-white">
                  <tr>
                    {content.tableHeaders.map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-sm font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {content.pricingRows.map(row => (
                    <tr key={row.category} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-semibold text-navy-900 text-sm">{row.category}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">€{row.daily}{content.dayLabel}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">€{row.weekly}{content.weekLabel}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-navy-900">€{row.monthly}{content.monthLabel}</td>
                      <td className="px-5 py-3.5">
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">{content.saveLabel} {row.savings}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">{content.pricingNote}</p>
        </div>
      </section>

      <section className="py-12 hero-gradient">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-3">{content.ctaHeading}</h2>
          <p className="text-gray-300 mb-8">{content.ctaSubtitle}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/fleet" className="btn-primary text-base px-8 py-3.5">{content.browseCarsButton}</Link>
            <a href={`https://wa.me/${whatsappNumber}?text=Hello, I'm interested in a monthly car rental.`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3.5 rounded-md transition-colors">
              <Phone className="h-5 w-5" /> {content.whatsappButton}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
