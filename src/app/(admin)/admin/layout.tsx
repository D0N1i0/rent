// src/app/(admin)/admin/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";
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
    <AdminLayoutClient
      user={session.user}
      pendingBookingsCount={pendingBookingsCount}
      unreadContactCount={unreadContactCount}
      newFeedbackCount={newFeedbackCount}
    >
      {children}
    </AdminLayoutClient>
  );
}
