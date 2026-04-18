// src/app/(admin)/admin/contact-submissions/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ContactSubmissionsAdminClient } from "@/components/admin/contact-submissions-admin-client";

const PAGE_SIZE = 25;

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function AdminContactSubmissionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const statusFilter = sp.status === "unread" ? false : sp.status === "read" ? true : undefined;

  const where = statusFilter !== undefined ? { isRead: statusFilter } : {};

  const [submissions, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.contactSubmission.count({ where }),
  ]);

  return (
    <ContactSubmissionsAdminClient
      submissions={submissions}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
    />
  );
}
