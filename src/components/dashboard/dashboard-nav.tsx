// src/components/dashboard/dashboard-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  User,
  Lock,
  LogOut,
  ChevronDown,
  Home,
  Menu,
  X,
  LayoutDashboard as AdminIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, useLanguage } from "@/lib/i18n/context";

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN" || user.role === "STAFF";
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();
  const { locale } = useLanguage();

  const navLinks = [
    { href: "/dashboard", label: locale === "al" ? "Përmbledhje" : "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/bookings", label: t.dashboard.bookings, icon: Calendar },
    { href: "/dashboard/profile", label: t.dashboard.profile, icon: User },
    { href: "/dashboard/security", label: t.dashboard.security, icon: Lock },
  ];

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Back to site — desktop */}
        <Link
          href="/"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors mr-1"
        >
          <Home className="h-3.5 w-3.5" />
          {locale === "al" ? "Faqja" : "Site"}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/20 text-white ring-1 ring-white/20"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                )}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* User menu */}
        <div className="relative group ml-1">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
            <div className="h-7 w-7 rounded-full bg-crimson-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="hidden sm:block max-w-[80px] truncate">{user.name?.split(" ")[0]}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-navy-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <Link href="/" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-navy-50 hover:text-navy-900">
              <Home className="h-4 w-4" /> {locale === "al" ? "Kthehu te Faqja" : "Back to Website"}
            </Link>
            {isAdmin && (
              <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-crimson-600 hover:bg-red-50 font-medium">
                <AdminIcon className="h-4 w-4" /> {t.nav.adminPanel}
              </Link>
            )}
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left"
            >
              <LogOut className="h-4 w-4" /> {t.nav.signOut}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile slide-down nav */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 z-40 bg-navy-900 border-t border-white/10 shadow-xl">
          <nav className="page-container py-3 flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Home className="h-4 w-4" /> {locale === "al" ? "Kthehu te Faqja" : "Back to Site"}
            </Link>
            <div className="border-t border-white/10 my-1" />
            {navLinks.map((link) => {
              const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-crimson-500" />}
                </Link>
              );
            })}
            {isAdmin && (
              <>
                <div className="border-t border-white/10 my-1" />
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-crimson-400 hover:text-crimson-300 hover:bg-white/10 transition-colors"
                >
                  <AdminIcon className="h-4 w-4" /> {t.nav.adminPanel}
                </Link>
              </>
            )}
            <div className="border-t border-white/10 my-1" />
            <button
              onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-white/10 transition-colors w-full text-left"
            >
              <LogOut className="h-4 w-4" /> {t.nav.signOut}
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
