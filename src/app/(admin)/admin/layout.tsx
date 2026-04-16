// src/app/(admin)/admin/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard");

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "STAFF") redirect("/");

  const [pendingBookingsCount, unreadContactCount, newFeedbackCount] = await Promise.all([
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.contactSubmission.count({ where: { isRead: false } }),
    prisma.feedback.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar
        pendingBookingsCount={pendingBookingsCount}
        unreadContactCount={unreadContactCount}
        newFeedbackCount={newFeedbackCount}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
