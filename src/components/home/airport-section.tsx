import Link from "next/link";
import { Plane, Clock, Phone, CheckCircle2 } from "lucide-react";
import type { PublicSettings } from "@/lib/settings";

export function AirportSection({ content, settings }: { content: Record<string, string>; settings: PublicSettings }) {
  const title = content.airport_title || "Land. Grab Keys. Start Exploring.";
  const description = content.airport_description || "We offer direct meet & greet service at Prishtina International Airport Adem Jashari. Our agent will be waiting in the arrivals hall with your name on a sign — no searching, no waiting, no stress.";
  const fee = content.airport_fee || "€15 (pickup or drop-off)";
  const meet = content.airport_meet_greet_fee || "+€20 (arrivals hall)";
  return (
    <section className="py-20 bg-white">
      <div className="page-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-crimson-50 text-crimson-600 text-sm font-semibold rounded-full px-4 py-1.5 mb-6"><Plane className="h-4 w-4" />Prishtina Airport Service</div>
            <h2 className="section-heading mb-4">{title}</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">{description}</p>
            <ul className="space-y-3 mb-8">{["Available 24/7 — any flight, any time", "Arrivals hall sign service included", "Pre-booked online in advance", "All vehicle categories available", "Instant WhatsApp confirmation"].map((item) => <li key={item} className="flex items-center gap-3 text-gray-700"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{item}</li>)}</ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/airport-rental" className="btn-primary">Airport Rental Details</Link>
              <a href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hello, I'd like to arrange airport pickup with ${settings.businessName}.`)}`} target="_blank" rel="noopener noreferrer" className="btn-outline"><Phone className="h-4 w-4" />WhatsApp Us</a>
            </div>
          </div>
          <div className="relative">
            <div className="bg-navy-900 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6"><div className="h-12 w-12 bg-crimson-500 rounded-xl flex items-center justify-center"><Plane className="h-6 w-6 text-white" /></div><div><div className="font-bold text-lg">Prishtina Airport</div><div className="text-gray-400 text-sm">Adem Jashari International</div></div></div>
              <div className="space-y-4">{[{ label: "Airport Fee", value: fee }, { label: "Meet & Greet", value: meet }, { label: "Available", value: settings.supportLabel }, { label: "Notice Required", value: "Minimum 2 hours advance" }].map(({ label, value }) => <div key={label} className="flex items-center justify-between border-b border-white/10 pb-3"><span className="text-gray-400 text-sm">{label}</span><span className="font-semibold text-sm">{value}</span></div>)}</div>
              <div className="mt-6 p-4 bg-white/10 rounded-xl"><div className="flex items-center gap-2 text-green-400 font-semibold text-sm mb-1"><Clock className="h-4 w-4" />Always Available</div><p className="text-gray-300 text-xs">Book online anytime. We will confirm your airport slot quickly via WhatsApp.</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
