// src/components/home/faq-preview.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import type { FaqItem } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

export function FaqPreview({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const { locale } = useLanguage();
  const isAl = locale === "al";

  if (!items.length) return null;
  return (
    <section className="py-20 bg-white">
      <div className="page-container">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="section-heading mb-4">
              {isAl ? "Pyetje të Shpeshta" : "Frequently Asked Questions"}
            </h2>
            <p className="section-subheading mb-6">
              {isAl
                ? "Gjithçka që duhet të dini rreth qirasë së makinës me AutoKos."
                : "Everything you need to know about renting a car with AutoKos."}
            </p>
            <Link href="/faq" className="btn-secondary inline-flex items-center gap-2 text-sm">
              {isAl ? "Shiko Të Gjitha Pyetjet" : "View All FAQs"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                >
                  <span className="font-medium text-navy-900 text-sm pr-4">{item.question}</span>
                  <ChevronDown className={cn("h-4 w-4 text-gray-400 shrink-0 transition-transform", openId === item.id && "rotate-180")} />
                </button>
                {openId === item.id && (
                  <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
