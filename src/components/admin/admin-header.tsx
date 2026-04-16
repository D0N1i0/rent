// src/components/admin/admin-header.tsx
"use client";
import { signOut } from "next-auth/react";
import { Bell, LogOut, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

interface AdminHeaderProps {
  user: { name?: string | null; email?: string | null };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-700">Admin Panel</h2>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/" target="_blank" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-navy-900 transition-colors">
          <ExternalLink className="h-3.5 w-3.5" />
          View Site
        </Link>
        <div className="h-8 w-8 bg-navy-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {getInitials(user.name ?? user.email ?? "A")}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-navy-900">{user.name}</p>
          <p className="text-[10px] text-gray-400">{user.email}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
