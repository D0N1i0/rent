// src/components/home/why-choose-us.tsx
import { Shield, Clock, CreditCard, MapPin, Headphones, Star } from "lucide-react";

const icons = [Shield, Clock, CreditCard, MapPin, Star, Headphones];

interface WhyChooseUsProps {
  content: Record<string, string>;
}

export function WhyChooseUs({ content }: WhyChooseUsProps) {
  const title = content.why_title || "Why Choose AutoKos?";
  const subtitle = content.why_subtitle || "We're not just a car rental service — we're your trusted partner for every journey across Kosovo.";

  const reasons = [1, 2, 3, 4, 5, 6].map((i) => ({
    icon: icons[i - 1],
    title: content[`why_${i}_title`] || "",
    description: content[`why_${i}_body`] || "",
  })).filter((r) => r.title);

  if (reasons.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="page-container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="section-heading">{title}</h2>
          <p className="section-subheading mt-4">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason) => (
            <div key={reason.title} className="group p-6 rounded-xl border border-gray-100 hover:border-navy-200 hover:shadow-md transition-all bg-white">
              <div className="h-12 w-12 bg-navy-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-navy-900 transition-colors">
                <reason.icon className="h-6 w-6 text-navy-900 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-navy-900 mb-2">{reason.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
