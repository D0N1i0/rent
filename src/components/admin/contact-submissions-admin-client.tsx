"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ContactSubmission } from "@prisma/client";
import { formatDateTime } from "@/lib/utils";
import { Mail, Archive, Search, Trash2, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  submissions: ContactSubmission[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export function ContactSubmissionsAdminClient({ submissions, total = submissions.length, page = 1, pageSize = 25 }: Props) {
  const [items, setItems] = useState(submissions);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "read" | "unread">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesStatus = status === "all" || (status === "read" ? item.isRead : !item.isRead);
    const haystack = `${item.name} ${item.email} ${item.phone ?? ""} ${item.subject ?? ""} ${item.message}`.toLowerCase();
    return matchesStatus && haystack.includes(query.toLowerCase());
  }), [items, query, status]);

  const unreadCount = useMemo(() => items.filter((i) => !i.isRead).length, [items]);

  const patch = async (id: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/contact-submissions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) return false;
    const data = await res.json();
    setItems((prev) => prev.map((item) => (item.id === id ? data.submission : item)));
    return true;
  };

  const del = async (id: string) => {
    if (!confirm("Delete inquiry?")) return;
    const res = await fetch(`/api/admin/contact-submissions/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const markAllRead = async () => {
    const unreadIds = items.filter((i) => !i.isRead).map((i) => i.id);
    if (unreadIds.length === 0) return;
    setMarkingAllRead(true);
    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/admin/contact-submissions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true }),
          })
        )
      );
      setItems((prev) => prev.map((item) => (!item.isRead ? { ...item, isRead: true } : item)));
    } finally {
      setMarkingAllRead(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Contact Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">Review, triage, and archive website contact inquiries.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-900 text-white text-sm font-medium hover:bg-navy-800 disabled:opacity-50 transition-colors shrink-0"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAllRead ? "Marking…" : `Mark All Read (${unreadCount})`}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone, subject, or message" className="form-input pl-10" />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "unread", "read"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`px-3 py-2 rounded-lg text-sm border ${status === value ? "border-navy-900 bg-navy-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {value[0].toUpperCase() + value.slice(1)}
              {value === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 bg-crimson-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((item) => {
          const isExpanded = expanded === item.id;
          const isUnread = !item.isRead;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                isUnread
                  ? "border-l-4 border-l-crimson-500 border-gray-100"
                  : "border-gray-100"
              }`}
            >
              {/* Header row — always visible, click to expand */}
              <button
                type="button"
                onClick={() => {
                  setExpanded(isExpanded ? null : item.id);
                  if (isUnread) patch(item.id, { isRead: true });
                }}
                className="w-full text-left p-5 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-sm ${isUnread ? "font-bold text-navy-900" : "font-semibold text-navy-900"}`}>
                        {item.name}
                      </h3>
                      <span className={`status-badge text-xs ${item.isRead ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                        {item.isRead ? "Read" : "Unread"}
                      </span>
                      {item.repliedAt && (
                        <span className="status-badge text-xs bg-green-50 text-green-700 border-green-200">Archived / replied</span>
                      )}
                    </div>
                    <p className={`text-sm mt-0.5 break-all ${isUnread ? "text-gray-700" : "text-gray-500"}`}>
                      {item.email}{item.phone ? ` · ${item.phone}` : ""}
                    </p>
                    {item.subject && (
                      <p className={`text-sm mt-1 ${isUnread ? "font-semibold text-navy-900" : "font-medium text-gray-700"}`}>
                        {item.subject}
                      </p>
                    )}
                    {!isExpanded && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.message}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0 mt-0.5">{formatDateTime(item.createdAt)}</p>
                </div>
              </button>

              {/* Expanded full message + actions */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/30">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{item.message}</p>

                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                    <a
                      href={`mailto:${item.email}?subject=${encodeURIComponent(
                        item.subject ? `Re: ${item.subject}` : "Re: Website inquiry"
                      )}&body=${encodeURIComponent(`Hi ${item.name},\n\n`)}`}
                      className="btn-outline text-sm px-3 py-2 flex items-center gap-1.5"
                    >
                      <Mail className="h-4 w-4" /> Reply via Email
                    </a>
                    <button
                      onClick={() => patch(item.id, { isRead: !item.isRead })}
                      className="btn-outline text-sm px-3 py-2"
                    >
                      {item.isRead ? "Mark Unread" : "Mark Read"}
                    </button>
                    <button
                      onClick={() => patch(item.id, { isRead: true, repliedAt: new Date().toISOString() })}
                      className="btn-outline text-sm px-3 py-2 flex items-center gap-1.5"
                    >
                      <Archive className="h-4 w-4" /> Archive
                    </button>
                    <button
                      onClick={() => del(item.id)}
                      className="px-3 py-2 rounded-lg text-sm border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
            No inquiries match the current filters.
          </div>
        )}
      </div>

      {Math.ceil(total / pageSize) > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/contact-submissions?page=${page - 1}`}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            )}
            {page < Math.ceil(total / pageSize) && (
              <Link
                href={`/admin/contact-submissions?page=${page + 1}`}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
