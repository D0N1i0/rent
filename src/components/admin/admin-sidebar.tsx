// src/components/admin/admin-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Car, Calendar, Users, MapPin, Package, Tag, Star,
  HelpCircle, Home, Settings, FileText, Image, Car as CarIcon,
  BarChart2, Activity, ChevronRight, Mail, Globe, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics & Reports", icon: BarChart2 },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: Calendar },
      { href: "/admin/cars", label: "Fleet / Cars", icon: Car },
      { href: "/admin/categories", label: "Categories", icon: BarChart2 },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
      { href: "/admin/extras", label: "Extras & Services", icon: Package },
      { href: "/admin/seasonal-pricing", label: "Seasonal Pricing", icon: Tag },
      { href: "/admin/availability-blocks", label: "Availability Blocks", icon: Activity },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/homepage", label: "Homepage", icon: Home },
      { href: "/admin/offers", label: "Offers", icon: Tag },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
      { href: "/admin/legal", label: "Legal Pages", icon: FileText },
      { href: "/admin/media", label: "Media", icon: Image },
      { href: "/admin/contact-submissions", label: "Contact Inbox", icon: Mail },
      { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/seo", label: "SEO Management", icon: Globe },
      { href: "/admin/activity-log", label: "Activity Log", icon: Activity },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  pendingBookingsCount?: number;
  unreadContactCount?: number;
  newFeedbackCount?: number;
}

export function AdminSidebar({ pendingBookingsCount = 0, unreadContactCount = 0, newFeedbackCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();

  const badges: Record<string, number> = {
    "/admin/bookings": pendingBookingsCount,
    "/admin/contact-submissions": unreadContactCount,
    "/admin/feedback": newFeedbackCount,
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-navy-900 text-white shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <CarIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display text-lg font-bold text-white">Admin Panel</span>
            <span className="block text-[10px] text-gray-400 font-medium tracking-wider uppercase">Management</span>
          </div>
        </Link>
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
          ← Back to Website
        </Link>
      </div>
    </aside>
  );
}
