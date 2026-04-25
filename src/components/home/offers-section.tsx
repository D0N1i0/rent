// src/components/home/offers-section.tsx
import { Tag } from "lucide-react";
import type { Offer } from "@prisma/client";
import { formatDate } from "@/lib/utils";

export function OffersSection({
  offers,
  content,
  locale = "en",
}: {
  offers: Offer[];
  content?: Record<string, string>;
  locale?: "en" | "al";
}) {
  if (!offers.length) return null;
  const isAl = locale === "al";
  return (
    <section className="py-20 bg-white">
      <div className="page-container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="section-heading">{content?.offers_title ?? (isAl ? "Ofertat & Promovimet Aktuale" : "Current Offers & Promotions")}</h2>
          <p className="section-subheading mt-4">
            {isAl
              ? "Oferta me kohë të kufizuar dhe zbritje ekskluzive për udhëtarët e mençur."
              : "Limited time deals and exclusive discounts for smart travellers."}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {offers.map((offer) => (
            <div key={offer.id} className="relative rounded-xl border-2 border-dashed border-crimson-200 bg-crimson-50 p-5 hover:border-crimson-400 transition-colors">
              <div className="h-10 w-10 bg-crimson-500 rounded-lg flex items-center justify-center mb-4">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-navy-900 mb-2">{offer.title}</h3>
              {offer.description && (
                <p className="text-sm text-gray-600 mb-3">{offer.description}</p>
              )}
              {offer.code && (
                <div className="inline-flex items-center gap-2 bg-white border border-crimson-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-500">{isAl ? "Kodi:" : "Code:"}</span>
                  <span className="font-mono font-bold text-crimson-600 text-sm">{offer.code}</span>
                </div>
              )}
              {(offer.discountPct || offer.discountAmt) && (
                <div className="absolute top-4 right-4 bg-crimson-500 text-white text-xs font-bold rounded-full px-2.5 py-1">
                  {offer.discountPct ? `-${offer.discountPct}%` : `-€${offer.discountAmt}`}
                </div>
              )}
              {offer.validUntil && (
                <p className="text-xs text-gray-400 mt-2">
                  {isAl ? "Deri më" : "Until"} {formatDate(offer.validUntil)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
