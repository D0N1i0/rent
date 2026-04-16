// src/components/home/testimonials-section.tsx
import { Star } from "lucide-react";
import type { Testimonial } from "@prisma/client";

export function TestimonialsSection({ testimonials, content }: { testimonials: Testimonial[]; content?: Record<string, string> }) {
  if (!testimonials.length) return null;
  return (
    <section className="py-20 bg-gray-50">
      <div className="page-container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="section-heading">{content?.testimonials_title ?? "What Our Customers Say"}</h2>
          <p className="section-subheading mt-4">Real reviews from real customers who've driven with AutoKos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">"{t.content}"</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-navy-900 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-navy-900">{t.name}</p>
                  {t.location && <p className="text-xs text-gray-500">{t.location}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
