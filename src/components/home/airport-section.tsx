import Link from "next/link";
import { Plane, Clock, Phone, CheckCircle2 } from "lucide-react";
import type { PublicSettings } from "@/lib/settings";

const BULLETS_EN = [
  "Available 24/7 — any flight, any time",
  "Arrivals hall sign service included",
  "Pre-booked online in advance",
  "All vehicle categories available",
  "Instant WhatsApp confirmation",
];

const BULLETS_AL = [
  "I disponueshëm 24/7 — çdo fluturim, çdo kohë",
  "Shërbimi i tabelës në sallën e mbërritjeve i përfshirë",
  "Rezervohet paraprakisht online",
  "Të gjitha kategoritë e automjeteve të disponueshme",
  "Konfirmim i menjëhershëm me WhatsApp",
];

export function AirportSection({
  content,
  settings,
  locale = "en",
}: {
  content: Record<string, string>;
  settings: PublicSettings;
  locale?: "en" | "al";
}) {
  const isAl = locale === "al";
  const title = content.airport_title || (isAl ? "Zbrit. Merre Çelësin. Fillo të Eksplorosh." : "Land. Grab Keys. Start Exploring.");
  const description = content.airport_description || (isAl
    ? `Ofrojmë shërbim takimi direkt në Aeroportin Ndërkombëtar Adem Jashari të Prishtinës. Agjenti ynë do t'ju presë në sallën e mbërritjeve me emrin tuaj — pa kërkim, pa pritje, pa stres.`
    : "We offer direct meet & greet service at Prishtina International Airport Adem Jashari. Our agent will be waiting in the arrivals hall with your name on a sign — no searching, no waiting, no stress.");
  const fee = content.airport_fee || "€15 (pickup or drop-off)";
  const meet = content.airport_meet_greet_fee || "+€20 (arrivals hall)";
  const bullets = isAl ? BULLETS_AL : BULLETS_EN;

  return (
    <section className="py-20 bg-white">
      <div className="page-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-crimson-50 text-crimson-600 text-sm font-semibold rounded-full px-4 py-1.5 mb-6">
              <Plane className="h-4 w-4" />
              {isAl ? "Shërbimi i Aeroportit të Prishtinës" : "Prishtina Airport Service"}
            </div>
            <h2 className="section-heading mb-4">{title}</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">{description}</p>
            <ul className="space-y-3 mb-8">
              {bullets.map((item) => (
                <li key={item} className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />{item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/airport-rental" className="btn-primary">
                {isAl ? "Detajet e Qirasë në Aeroport" : "Airport Rental Details"}
              </Link>
              <a
                href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                  isAl
                    ? `Përshëndetje, dëshiroj të organizoj marrje nga aeroporti me ${settings.businessName}.`
                    : `Hello, I'd like to arrange airport pickup with ${settings.businessName}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <Phone className="h-4 w-4" />
                {isAl ? "Na Kontaktoni në WhatsApp" : "WhatsApp Us"}
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="bg-navy-900 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-crimson-500 rounded-xl flex items-center justify-center">
                  <Plane className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">{isAl ? "Aeroporti i Prishtinës" : "Prishtina Airport"}</div>
                  <div className="text-gray-400 text-sm">{isAl ? "Adem Jashari Ndërkombëtar" : "Adem Jashari International"}</div>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: isAl ? "Tarifa e Aeroportit" : "Airport Fee", value: fee },
                  { label: isAl ? "Takim & Shoqërim" : "Meet & Greet", value: meet },
                  { label: isAl ? "I Disponueshëm" : "Available", value: settings.supportLabel },
                  { label: isAl ? "Njoftim i Nevojshëm" : "Notice Required", value: isAl ? "Minimumi 2 orë paraprakisht" : "Minimum 2 hours advance" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-gray-400 text-sm">{label}</span>
                    <span className="font-semibold text-sm">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-white/10 rounded-xl">
                <div className="flex items-center gap-2 text-green-400 font-semibold text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  {isAl ? "Gjithmonë i Disponueshëm" : "Always Available"}
                </div>
                <p className="text-gray-300 text-xs">
                  {isAl
                    ? "Rezervoni online në çdo kohë. Do t'ju konfirmojmë sllotin e aeroportit shpejt nëpërmjet WhatsApp."
                    : "Book online anytime. We will confirm your airport slot quickly via WhatsApp."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
