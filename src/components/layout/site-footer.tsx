"use client";
import Link from "next/link";
import { Phone, Mail, MapPin, Car, Facebook, Instagram, Youtube } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface CarCategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface SiteFooterProps {
  settings: {
    businessName: string;
    phone: string;
    supportEmail: string;
    address: string;
    footerTagline: string;
    whatsappNumber: string;
    facebookUrl: string;
    instagramUrl: string;
    youtubeUrl: string;
  };
  categories?: CarCategoryItem[];
}

export function SiteFooter({ settings, categories }: SiteFooterProps) {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const serviceLinks = [
    { label: t.footer.airportPickup, href: "/airport-rental" },
    { label: t.footer.longTermRental, href: "/long-term" },
    { label: t.footer.ourFleet, href: "/fleet" },
    { label: t.footer.aboutUs, href: "/about" },
    { label: t.nav.faq, href: "/faq" },
    { label: t.footer.contactUs, href: "/contact" },
  ];

  return (
    <footer className="bg-navy-900 text-white">
      <div className="page-container py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-5">
              <div className="h-9 w-9 bg-crimson-500 rounded-md flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-2xl font-bold text-white">{settings.businessName}</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{settings.footerTagline}</p>
            <div className="flex items-center gap-3">
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-crimson-500 transition-colors" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
              )}
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-crimson-500 transition-colors" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
              )}
              {settings.youtubeUrl && (
                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-crimson-500 transition-colors" aria-label="YouTube"><Youtube className="h-4 w-4" /></a>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">{t.footer.ourFleet}</h3>
            {categories && categories.length > 0 ? (
              <ul className="space-y-2.5">{categories.map((cat) => <li key={cat.id}><Link href={`/fleet?category=${cat.slug}`} className="text-sm text-gray-400 hover:text-white transition-colors">{cat.name}</Link></li>)}</ul>
            ) : null}
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">{t.footer.services}</h3>
            <ul className="space-y-2.5">
              {serviceLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-5">{t.footer.contactUs}</h3>
            <ul className="space-y-4">
              <li><a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors group"><Phone className="h-4 w-4 mt-0.5 shrink-0 text-crimson-400 group-hover:text-crimson-300" /><span>{settings.phone}</span></a></li>
              <li><a href={`mailto:${settings.supportEmail}`} className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors group"><Mail className="h-4 w-4 mt-0.5 shrink-0 text-crimson-400 group-hover:text-crimson-300" /><span>{settings.supportEmail}</span></a></li>
              <li><div className="flex items-start gap-3 text-sm text-gray-400"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-crimson-400" /><span>{settings.address}</span></div></li>
              {settings.whatsappNumber && (
                <li className="pt-2">
                  <a href={`https://wa.me/${settings.whatsappNumber}?text=Hello ${encodeURIComponent(settings.businessName)}, I'd like to enquire about car rental.`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {currentYear} {settings.businessName}. {t.footer.allRightsReserved}</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link href="/terms" className="hover:text-gray-300 transition-colors">{t.footer.terms}</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">{t.footer.privacy}</Link>
            <Link href="/rental-policy" className="hover:text-gray-300 transition-colors">{t.footer.rentalPolicy}</Link>
            <Link href="/insurance" className="hover:text-gray-300 transition-colors">{t.footer.insurance}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
