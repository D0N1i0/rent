// src/components/admin/admin-layout-client.tsx
"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

interface AdminLayoutClientProps {
  user: { name?: string | null; email?: string | null };
  pendingBookingsCount: number;
  unreadContactCount: number;
  newFeedbackCount: number;
  children: React.ReactNode;
}

export function AdminLayoutClient({
  user,
  pendingBookingsCount,
  unreadContactCount,
  newFeedbackCount,
  children,
}: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        pendingBookingsCount={pendingBookingsCount}
        unreadContactCount={unreadContactCount}
        newFeedbackCount={newFeedbackCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile/tablet backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <AdminHeader
          user={user}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
