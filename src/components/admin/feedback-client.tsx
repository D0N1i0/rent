// src/components/admin/feedback-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Save, Trash2, Loader2, ThumbsUp, Lightbulb, Star, Bug, HelpCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-red-50 text-red-700 border-red-200",
  IN_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  DISMISSED: "bg-gray-50 text-gray-500 border-gray-200",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  COMPLAINT: <ThumbsUp className="h-4 w-4 rotate-180 text-red-500" />,
  SUGGESTION: <Lightbulb className="h-4 w-4 text-amber-500" />,
  FEATURE_REQUEST: <Star className="h-4 w-4 text-blue-500" />,
  BUG_REPORT: <Bug className="h-4 w-4 text-orange-500" />,
  OTHER: <HelpCircle className="h-4 w-4 text-gray-400" />,
};

type FeedbackStatus = "NEW" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";

interface AdminFeedbackClientProps {
  item: {
    id: string;
    type: string;
    subject: string;
    message: string;
    status: FeedbackStatus;
    adminNotes?: string | null;
    name?: string | null;
    email?: string | null;
    createdAt: Date | string;
    user?: { email: string; firstName?: string | null; lastName?: string | null } | null;
  };
}

export function AdminFeedbackClient({ item }: AdminFeedbackClientProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<FeedbackStatus>(item.status);
  const [adminNotes, setAdminNotes] = useState(item.adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const authorName = item.user
    ? item.user.firstName && item.user.lastName
      ? `${item.user.firstName} ${item.user.lastName}`
      : item.user.email
    : item.name || item.email || "Anonymous";

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/feedback/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this feedback permanently?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/feedback/${item.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{TYPE_ICONS[item.type] ?? TYPE_ICONS.OTHER}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-navy-900 text-sm">{item.subject}</span>
            <span className={`status-badge text-xs border ${STATUS_COLORS[item.status]}`}>{item.status.replace("_", " ")}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.type.replace("_", " ")}</span>
          </div>
          <p className="text-xs text-gray-500">
            From <strong>{authorName}</strong> · {formatDate(item.createdAt)}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-1.5 text-gray-400 hover:text-navy-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.message}</p>
          </div>

          {item.email && (
            <p className="text-xs text-gray-500">Contact: <a href={`mailto:${item.email}`} className="text-navy-900 hover:underline">{item.email}</a></p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
                className="form-input text-sm appearance-none"
              >
                <option value="NEW">New</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes (not visible to user)..."
              className="form-input resize-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
            >
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving</> : <><Save className="h-3.5 w-3.5" /> Save</>}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm px-4 py-2 flex items-center gap-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors font-medium"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
