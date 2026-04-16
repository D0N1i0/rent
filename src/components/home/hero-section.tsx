"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Clock, ArrowRight, ChevronDown, Shield, Star, Car } from "lucide-react";
import type { Location } from "@prisma/client";
import type { PublicSettings } from "@/lib/settings";

interface HeroSectionProps {
  locations: Location[];
  content: Record<string, string>;
  settings: PublicSettings;
}

export function HeroSection({ locations, content, settings }: HeroSectionProps) {
  const router = useRouter();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDays = new Date(today);
  threeDays.setDate(threeDays.getDate() + 3);

  const [form, setForm] = useState({
    pickupLocationId: "",
    dropoffLocationId: "",
    sameLocation: true,
    pickupDate: tomorrow.toISOString().split("T")[0],
    pickupTime: "10:00",
    returnDate: threeDays.toISOString().split("T")[0],
    returnTime: "10:00",
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      pickupLocationId: form.pickupLocationId,
      dropoffLocationId: form.sameLocation ? form.pickupLocationId : form.dropoffLocationId,
      pickupDate: form.pickupDate,
      pickupTime: form.pickupTime,
      returnDate: form.returnDate,
      returnTime: form.returnTime,
    });
    router.push(`/fleet?${params.toString()}`);
  }

  const timeOptions = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`);
  const title = content.hero_title_en || `Drive Kosovo in Style with ${settings.businessName}`;
  const subtitle = content.hero_subtitle_en || `Premium car rental from Prishtina Airport and across Kosovo. Transparent pricing, clean vehicles, and direct support from ${settings.businessName}.`;
  const badge = content.hero_badge || `${settings.supportLabel} · Airport Pickup`;
  const statCustomers = content.hero_stat_customers || "500+";
  const statFleet = content.hero_stat_fleet || "30+";
  const statLocations = content.hero_stat_locations || String(locations.length || 7);

  return (
    <section className="relative min-h-[92vh] flex items-center hero-gradient overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-crimson-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-5" />
      </div>
      <div className="page-container relative z-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
              <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              {badge}
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">{title}</h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-xl">{subtitle}</p>
            <div className="flex flex-wrap gap-4 mb-10">
              {[{ icon: Shield, label: "Fully Insured" }, { icon: Star, label: "Transparent Pricing" }, { icon: Car, label: "Modern Fleet" }].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-300"><Icon className="h-4 w-4 text-crimson-400" />{label}</div>
              ))}
            </div>
            <div className="flex items-center gap-8">
              {[{ value: statCustomers, label: "Happy Customers" }, { value: statFleet, label: "Vehicles" }, { value: statLocations, label: "Locations" }].map(({ value, label }) => (
                <div key={label}><div className="text-2xl font-bold text-white">{value}</div><div className="text-xs text-gray-400">{label}</div></div>
              ))}
            </div>
          </div>
          <div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
              <h2 className="text-xl font-bold text-navy-900 mb-6">Find Your Perfect Car</h2>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Pickup Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select value={form.pickupLocationId} onChange={(e) => setForm({ ...form, pickupLocationId: e.target.value })} className="form-input pl-10 appearance-none" required>
                      <option value="">Select pickup location</option>
                      {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.isAirport ? "✈ " : ""}{loc.name}{loc.pickupFee > 0 ? ` (+€${loc.pickupFee})` : ""}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="sameLocation" checked={form.sameLocation} onChange={(e) => setForm({ ...form, sameLocation: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-navy-900" />
                  <label htmlFor="sameLocation" className="text-sm text-gray-600">Return to same location</label>
                </div>
                {!form.sameLocation && <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Drop-off Location</label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><select value={form.dropoffLocationId} onChange={(e) => setForm({ ...form, dropoffLocationId: e.target.value })} className="form-input pl-10 appearance-none" required><option value="">Select drop-off location</option>{locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}{loc.dropoffFee > 0 ? ` (+€${loc.dropoffFee})` : ""}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" /></div></div>}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Pickup Date</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="date" value={form.pickupDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} className="form-input pl-10" required /></div></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Pickup Time</label><div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><select value={form.pickupTime} onChange={(e) => setForm({ ...form, pickupTime: e.target.value })} className="form-input pl-10 appearance-none">{timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}</select></div></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Return Date</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="date" value={form.returnDate} min={form.pickupDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} className="form-input pl-10" required /></div></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Return Time</label><div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><select value={form.returnTime} onChange={(e) => setForm({ ...form, returnTime: e.target.value })} className="form-input pl-10 appearance-none">{timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}</select></div></div>
                </div>
                <button type="submit" className="w-full btn-primary py-3 text-base"><span>Search Available Cars</span><ArrowRight className="h-4 w-4" /></button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
