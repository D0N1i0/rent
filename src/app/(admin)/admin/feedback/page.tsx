// src/app/(admin)/admin/feedback/page.tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { MessageSquare, ThumbsUp, Lightbulb, Star, Bug, HelpCircle } from "lucide-react";
import { AdminFeedbackClient } from "@/components/admin/feedback-client";

interface Props {
  searchParams: Promise<{ page?: string; status?: string; type?: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-red-50 text-red-700 border-red-200",
  IN_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  DISMISSED: "bg-gray-50 text-gray-500 border-gray-200",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  COMPLAINT: <ThumbsUp className="h-3.5 w-3.5 rotate-180" />,
  SUGGESTION: <Lightbulb className="h-3.5 w-3.5" />,
  FEATURE_REQUEST: <Star className="h-3.5 w-3.5" />,
  BUG_REPORT: <Bug className="h-3.5 w-3.5" />,
  OTHER: <HelpCircle className="h-3.5 w-3.5" />,
};

export default async function AdminFeedbackPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 25;
  const status = sp.status;
  const type = sp.type;

  const validStatuses = ["NEW", "IN_REVIEW", "RESOLVED", "DISMISSED"];
  const validTypes = ["COMPLAINT", "SUGGESTION", "FEATURE_REQUEST", "BUG_REPORT", "OTHER"];

  const where: Record<string, unknown> = {};
  if (status && validStatuses.includes(status)) where.status = status;
  if (type && validTypes.includes(type)) where.type = type;

  const [items, total, counts] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.feedback.count({ where }),
    prisma.feedback.groupBy({ by: ["status"], _count: true }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const statusCounts = Object.fromEntries(counts.map((c: any) => [c.status, c._count]));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Feedback</h1>
          <p className="text-gray-500 text-sm mt-1">{total} submission{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "NEW", label: "New" },
          { key: "IN_REVIEW", label: "In Review" },
          { key: "RESOLVED", label: "Resolved" },
          { key: "DISMISSED", label: "Dismissed" },
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`/admin/feedback?status=${key}`}
            className={`bg-white rounded-xl border shadow-sm p-4 text-center hover:shadow-md transition-shadow ${status === key ? "border-navy-900 ring-2 ring-navy-900/20" : "border-gray-100"}`}
          >
            <p className={`text-2xl font-bold ${STATUS_COLORS[key].split(" ")[1]}`}>{statusCounts[key] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form method="GET" className="flex flex-wrap gap-3">
          <select name="status" defaultValue={status ?? ""} className="form-input text-sm w-auto">
            <option value="">All Statuses</option>
            {validStatuses.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <select name="type" defaultValue={type ?? ""} className="form-input text-sm w-auto">
            <option value="">All Types</option>
            {validTypes.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
          <button type="submit" className="btn-primary text-sm px-4 py-2">Filter</button>
          {(status || type) && <Link href="/admin/feedback" className="btn-secondary text-sm px-4 py-2">Clear</Link>}
        </form>
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No feedback found</p>
          </div>
        ) : (
          items.map((item: any) => (
            <AdminFeedbackClient key={item.id} item={item} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/feedback?page=${page - 1}${status ? `&status=${status}` : ""}${type ? `&type=${type}` : ""}`} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Previous</Link>}
            {page < totalPages && <Link href={`/admin/feedback?page=${page + 1}${status ? `&status=${status}` : ""}${type ? `&type=${type}` : ""}`} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
