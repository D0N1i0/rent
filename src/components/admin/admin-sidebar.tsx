// src/components/admin/admin-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Car, Calendar, Users, MapPin, Package, Tag, Star,
  HelpCircle, Home, Settings, FileText, Image, Car as CarIcon,
  BarChart2, Activity, ChevronRight, Mail, Globe, MessageSquare, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

interface AdminSidebarProps {
  pendingBookingsCount?: number;
  unreadContactCount?: number;
  newFeedbackCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({
  pendingBookingsCount = 0,
  unreadContactCount = 0,
  newFeedbackCount = 0,
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { locale } = useLanguage();

  const navGroups = [
    {
      label: locale === "al" ? "Pasqyra" : "Overview",
      items: [
        { href: "/admin/dashboard", label: locale === "al" ? "Kryefaqja" : "Dashboard", icon: LayoutDashboard },
        { href: "/admin/analytics", label: locale === "al" ? "Analitika & Raporte" : "Analytics & Reports", icon: BarChart2 },
      ],
    },
    {
      label: locale === "al" ? "Operacionet" : "Operations",
      items: [
        { href: "/admin/bookings", label: locale === "al" ? "Rezervimet" : "Bookings", icon: Calendar },
        { href: "/admin/cars", label: locale === "al" ? "Flotila / Makinat" : "Fleet / Cars", icon: Car },
        { href: "/admin/categories", label: locale === "al" ? "Kategoritë" : "Categories", icon: BarChart2 },
        { href: "/admin/users", label: locale === "al" ? "Përdoruesit" : "Users", icon: Users },
        { href: "/admin/locations", label: locale === "al" ? "Lokacionet" : "Locations", icon: MapPin },
        { href: "/admin/extras", label: locale === "al" ? "Shtesat & Shërbimet" : "Extras & Services", icon: Package },
        { href: "/admin/seasonal-pricing", label: locale === "al" ? "Çmimet Sezonale" : "Seasonal Pricing", icon: Tag },
        { href: "/admin/availability-blocks", label: locale === "al" ? "Bllokimet e Disponibilitetit" : "Availability Blocks", icon: Activity },
      ],
    },
    {
      label: locale === "al" ? "Përmbajtja" : "Content",
      items: [
        { href: "/admin/homepage", label: locale === "al" ? "Faqja Kryesore" : "Homepage", icon: Home },
        { href: "/admin/offers", label: locale === "al" ? "Ofertat" : "Offers", icon: Tag },
        { href: "/admin/reviews", label: locale === "al" ? "Vlerësimet" : "Reviews", icon: Star },
        { href: "/admin/faq", label: locale === "al" ? "Pyetje të Shpeshta" : "FAQ", icon: HelpCircle },
        { href: "/admin/legal", label: locale === "al" ? "Faqet Ligjore" : "Legal Pages", icon: FileText },
        { href: "/admin/media", label: locale === "al" ? "Media" : "Media", icon: Image },
        { href: "/admin/contact-submissions", label: locale === "al" ? "Mesazhet e Kontaktit" : "Contact Inbox", icon: Mail },
        { href: "/admin/feedback", label: locale === "al" ? "Komentet" : "Feedback", icon: MessageSquare },
      ],
    },
    {
      label: locale === "al" ? "Sistemi" : "System",
      items: [
        { href: "/admin/seo", label: locale === "al" ? "Menaxhimi SEO" : "SEO Management", icon: Globe },
        { href: "/admin/activity-log", label: locale === "al" ? "Regjistri i Aktivitetit" : "Activity Log", icon: Activity },
        { href: "/admin/settings", label: locale === "al" ? "Cilësimet" : "Settings", icon: Settings },
      ],
    },
  ];

  const badges: Record<string, number> = {
    "/admin/bookings": pendingBookingsCount,
    "/admin/contact-submissions": unreadContactCount,
    "/admin/feedback": newFeedbackCount,
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex-col bg-navy-900 text-white shrink-0 overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0 lg:flex ${isOpen ? "flex translate-x-0" : "-translate-x-full lg:flex"}`}>
      {/* Logo */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <CarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display text-lg font-bold text-white">Admin Panel</span>
            <span className="block text-[10px] text-gray-400 font-medium tracking-wider uppercase">
              {locale === "al" ? "Menaxhim" : "Management"}
            </span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-3">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
                const badgeCount = badges[item.href] ?? 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "admin-nav-item text-gray-400",
                      isActive && "active"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                    {badgeCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-crimson-500 text-white text-[10px] font-bold leading-none">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                    {isActive && badgeCount === 0 && (
                      <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-70" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link href="/" className="admin-nav-item text-gray-400 text-xs">
          {locale === "al" ? "← Kthehu në Faqe" : "← Back to Website"}
        </Link>
      </div>
    </aside>
  );
}
