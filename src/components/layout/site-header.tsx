"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Phone, User, LogOut, LayoutDashboard, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicSettings } from "@/lib/settings";
import { useLanguage } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function SiteHeader({ settings }: { settings: PublicSettings }) {
  const { data: session } = useSession();
  const { t, locale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
  const compactPhone = settings.phone.replace(/\s+/g, "");
  const topbarNotice = locale === "al" ? "✈ Marrja nga Aeroporti i Disponueshëm" : settings.topbarNotice;
  const supportLabel = locale === "al" ? "Mbështetje 24/7" : settings.supportLabel;

  const navLinks = [
    { label: t.nav.fleet, href: "/fleet" },
    {
      label: t.nav.services,
      href: "#",
      children: [
        { label: t.nav.airportRental, href: "/airport-rental" },
        { label: t.nav.longTermRental, href: "/long-term" },
        { label: t.nav.allLocations, href: "/contact" },
      ],
    },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.faq, href: "/faq" },
    { label: t.nav.contact, href: "/contact" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-white border-b border-gray-100"
      )}
    >
      <div className="bg-navy-900 text-white text-xs py-1.5 hidden sm:block">
        <div className="page-container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href={`tel:${compactPhone}`} className="flex items-center gap-1.5 hover:text-crimson-300 transition-colors">
              <Phone className="h-3 w-3" />
              {settings.phone}
            </a>
            <span className="text-white/40">|</span>
            <span>{supportLabel}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
              WhatsApp
            </a>
            <span className="text-white/40">|</span>
            <span>{topbarNotice}</span>
            <span className="text-white/40">|</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-navy-900 rounded-md flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-navy-900 leading-none">{settings.businessName}</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="relative">
                  <button
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-navy-900 transition-colors rounded-md hover:bg-gray-50"
                    onMouseEnter={() => setDropdownOpen(link.label)}
                    onMouseLeave={() => setDropdownOpen(null)}
                    onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === link.label ? null : link.label); }}
                    aria-expanded={dropdownOpen === link.label}
                    aria-haspopup="true"
                  >
                    {link.label}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", dropdownOpen === link.label && "rotate-180")} />
                  </button>
                  <div
                    className={cn(
                      "absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 transition-all duration-150",
                      dropdownOpen === link.label ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
                    )}
                    onMouseEnter={() => setDropdownOpen(link.label)}
                    onMouseLeave={() => setDropdownOpen(null)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {link.children.map((child) => (
                      <Link key={child.href} href={child.href} onClick={() => setDropdownOpen(null)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-navy-50 hover:text-navy-900 transition-colors">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={link.href} href={link.href} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-navy-900 transition-colors rounded-md hover:bg-gray-50">
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/fleet" className="hidden sm:inline-flex btn-primary text-sm px-4 py-2">
              {t.nav.bookNow}
            </Link>

            {session ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-navy-900 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="h-7 w-7 bg-navy-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden md:block">{session.user.name?.split(" ")[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-navy-50 hover:text-navy-900">
                    <User className="h-4 w-4" /> {t.nav.myAccount}
                  </Link>
                  <Link href="/dashboard/bookings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-navy-50 hover:text-navy-900">
                    <Car className="h-4 w-4" /> {t.nav.myBookings}
                  </Link>
                  {isAdmin && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-crimson-600 hover:bg-red-50 font-medium">
                        <LayoutDashboard className="h-4 w-4" /> {t.nav.adminPanel}
                      </Link>
                    </>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left">
                    <LogOut className="h-4 w-4" /> {t.nav.signOut}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-navy-900 transition-colors">{t.nav.signIn}</Link>
                <Link href="/register" className="btn-secondary text-sm px-4 py-2">{t.nav.register}</Link>
              </div>
            )}

            <button className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="page-container py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link href={link.href === "#" ? "/fleet" : link.href} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-navy-900 hover:bg-gray-50 rounded-md transition-colors" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
                {link.children?.map((child) => (
                  <Link key={child.href} href={child.href} className="block px-6 py-2 text-sm text-gray-500 hover:text-navy-900" onClick={() => setMobileOpen(false)}>
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
            {/* Mobile Book Now button */}
            <div className="px-3 pt-3 border-t border-gray-100">
              <Link href="/fleet" className="btn-primary w-full text-center" onClick={() => setMobileOpen(false)}>
                {t.nav.bookNow}
              </Link>
            </div>

            {/* Mobile sign-in / user actions */}
            {session ? (
              <div className="px-3 pt-2 space-y-1">
                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-navy-900 hover:bg-gray-50 rounded-md" onClick={() => setMobileOpen(false)}>
                  <User className="h-4 w-4" /> {t.nav.myAccount}
                </Link>
                <Link href="/dashboard/bookings" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-navy-900 hover:bg-gray-50 rounded-md" onClick={() => setMobileOpen(false)}>
                  <Car className="h-4 w-4" /> {t.nav.myBookings}
                </Link>
                {isAdmin && (
                  <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-crimson-600 hover:bg-red-50 rounded-md" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard className="h-4 w-4" /> {t.nav.adminPanel}
                  </Link>
                )}
                <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md w-full text-left">
                  <LogOut className="h-4 w-4" /> {t.nav.signOut}
                </button>
              </div>
            ) : (
              <div className="px-3 pt-2 flex gap-2">
                <Link href="/login" className="flex-1 text-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-navy-900 border border-gray-200 rounded-md" onClick={() => setMobileOpen(false)}>{t.nav.signIn}</Link>
                <Link href="/register" className="flex-1 btn-secondary text-center text-sm px-3 py-2.5" onClick={() => setMobileOpen(false)}>{t.nav.register}</Link>
              </div>
            )}

            {/* Mobile language switcher */}
            <div className="px-3 pt-3 pb-1 border-t border-gray-100">
              <div className="bg-navy-900 rounded-md inline-flex p-1">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
