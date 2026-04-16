// src/components/pages/faq-page-client.tsx
"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { FaqItem } from "@prisma/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

const categoryLabels: Record<string, string> = {
  general: "General Questions",
  booking: "Booking & Reservations",
  payment: "Payment & Deposit",
  insurance: "Insurance",
  pickup: "Pickup & Drop-off",
  requirements: "Requirements",
};

export function FaqPageClient({ items, categories, whatsappNumber }: { items: FaqItem[]; categories: string[]; whatsappNumber: string }) {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = items.filter(item => {
    const matchesSearch = !search.trim() ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy-900 py-16">
        <div className="page-container text-center">
          <h1 className="font-display text-4xl font-bold text-white mb-3">Frequently Asked Questions</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Everything you need to know about renting a car with AutoKos in Kosovo.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-crimson-500"
            />
          </div>
        </div>
      </div>

      <div className="page-container py-12">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn("px-4 py-2 rounded-full text-sm font-medium border transition-colors", activeCategory === "all" ? "bg-navy-900 text-white border-navy-900" : "bg-white border-gray-200 text-gray-600 hover:border-navy-300")}
          >
            All Topics
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn("px-4 py-2 rounded-full text-sm font-medium border transition-colors", activeCategory === cat ? "bg-navy-900 text-white border-navy-900" : "bg-white border-gray-200 text-gray-600 hover:border-navy-300")}
            >
              {categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            {items.length === 0 ? (
              <>
                <p className="text-gray-500 font-medium">No FAQs have been added yet.</p>
                <p className="text-gray-400 text-sm mt-1">Check back soon — we're adding answers to common questions.</p>
                <a href="/contact" className="mt-4 inline-block text-crimson-500 text-sm hover:underline">Contact us directly</a>
              </>
            ) : (
              <>
                <p className="text-gray-500 font-medium">No FAQs match your search.</p>
                <button onClick={() => { setSearch(""); setActiveCategory("all"); }} className="mt-3 text-crimson-500 text-sm hover:underline">Clear search</button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                >
                  <span className="font-semibold text-navy-900">{item.question}</span>
                  <ChevronDown className={cn("h-5 w-5 text-gray-400 shrink-0 mt-0.5 transition-transform", openId === item.id && "rotate-180")} />
                </button>
                {openId === item.id && (
                  <div className="px-5 pb-5">
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12 p-8 bg-navy-900 rounded-2xl text-white max-w-2xl mx-auto">
          <h2 className="font-bold text-xl mb-2">Still have questions?</h2>
          <p className="text-gray-300 mb-5">Our team is available 24/7 to help you.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm px-5 py-2.5">WhatsApp Chat</a>
            <Link href="/contact" className="inline-flex items-center gap-2 border border-white/30 text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-white/10 transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
