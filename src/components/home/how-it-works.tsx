// src/components/home/how-it-works.tsx
import { Search, CalendarCheck, Key, MapPin } from "lucide-react";

const icons = [Search, CalendarCheck, MapPin, Key];

interface HowItWorksProps {
  content: Record<string, string>;
}

export function HowItWorks({ content }: HowItWorksProps) {
  const title = content.how_title || "How It Works";
  const subtitle = content.how_subtitle || "Renting a car with AutoKos is simple, fast, and stress-free.";

  const steps = [1, 2, 3, 4].map((i) => ({
    icon: icons[i - 1],
    step: String(i).padStart(2, "0"),
    title: content[`how_${i}_title`] || "",
    description: content[`how_${i}_body`] || "",
  })).filter((s) => s.title);

  if (steps.length === 0) return null;

  return (
    <section className="py-20 bg-navy-900">
      <div className="page-container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">{title}</h2>
          <p className="text-lg text-gray-400 mt-4">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.step} className="relative text-center lg:text-left">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%+16px)] w-[calc(100%-32px)] h-px bg-white/10" />
              )}
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20 mb-5">
                <step.icon className="h-7 w-7 text-crimson-400" />
              </div>
              <div className="text-xs font-bold text-crimson-400 mb-2 tracking-widest uppercase">Step {step.step}</div>
              <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
