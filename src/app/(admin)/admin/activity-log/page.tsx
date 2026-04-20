// src/app/(admin)/admin/activity-log/page.tsx
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { Activity, Search } from "lucide-react";

/** Render a human-readable summary from structured activity log details */
function renderDetails(action: string, details: unknown): string {
  if (!details || typeof details !== "object") return "—";
  const d = details as Record<string, unknown>;

  switch (action) {
    case "BOOKING_STATUS_CHANGED":
      return `${d.from ?? "?"} → ${d.to ?? "?"}${d.reason ? ` · "${d.reason}"` : ""}`;
    case "BOOKING_CREATED":
      return `Ref: ${d.bookingRef ?? "?"} · ${d.carName ?? ""}${d.totalAmount != null ? ` · €${d.totalAmount}` : ""}`;
    case "BOOKING_CANCELLED":
      return `By: ${d.cancelledBy ?? "?"}${d.reason ? ` · "${d.reason}"` : ""}`;
    case "PAYMENT_RECEIVED":
      return `€${d.amount ?? "?"} received${d.paymentMethod ? ` via ${d.paymentMethod}` : ""}`;
    case "PAYMENT_FAILED":
      return `${d.lastError ?? "Unknown error"}`;
    case "PAYMENT_REFUNDED":
    case "PAYMENT_PARTIALLY_REFUNDED":
      return `€${d.amountRefunded ?? d.amount ?? "?"} refunded`;
    case "USER_REGISTERED":
      return `${d.email ?? ""}${d.name ? ` (${d.name})` : ""}`;
    case "USER_UPDATED":
      return d.fields
        ? `Updated: ${(d.fields as string[]).join(", ")}`
        : "Profile updated";
    case "PASSWORD_CHANGED":
      return "Password changed";
    case "ACCOUNT_DELETED":
      return d.email ? `${d.email}` : "Account removed";
    default:
      // Fallback: show key=value pairs, skip nulls
      return Object.entries(d)
        .filter(([, v]) => v != null)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ") || "—";
  }
}

/** Build a direct admin link for a given entity type + id */
function entityLink(entity: string | null, entityId: string | null): string | null {
  if (!entity || !entityId) return null;
  if (entity === "Booking") return `/admin/bookings/${entityId}`;
  if (entity === "User") return `/admin/users/${entityId}`;
  if (entity === "Car") return `/admin/cars/${entityId}`;
  return null;
}

interface Props {
  searchParams: Promise<{ page?: string; action?: string; search?: string }>;
}

export default async function AdminActivityLogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 40;
  const action = sp.action ?? "";
  const search = sp.search ?? "";

  const where = {
    ...(action ? { action } : {}),
    ...(search
      ? {
          OR: [
            { user: { email: { contains: search, mode: "insensitive" as const } } },
            { action: { contains: search, mode: "insensitive" as const } },
            { entity: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [logs, total, actions] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const actionColors: Record<string, string> = {
    USER_REGISTERED: "bg-green-100 text-green-800",
    USER_UPDATED: "bg-blue-100 text-blue-800",
    ACCOUNT_DELETED: "bg-red-100 text-red-800",
    BOOKING_CREATED: "bg-purple-100 text-purple-800",
    BOOKING_CANCELLED: "bg-orange-100 text-orange-800",
    BOOKING_STATUS_CHANGED: "bg-yellow-100 text-yellow-800",
    PASSWORD_CHANGED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-gray-400" /> Activity Log
          </h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} events recorded</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <form method="GET" className="flex flex-wrap gap-3 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by user email or action..."
              className="form-input pl-9 text-sm"
            />
          </div>
          <select name="action" defaultValue={action} className="form-input text-sm w-auto">
            <option value="">All Actions</option>
            {actions.map((a: { action: string }) => (
              <option key={a.action} value={a.action}>
                {a.action.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary text-sm px-4 py-2">
            Filter
          </button>
          {(search || action) && (
            <Link href="/admin/activity-log" className="btn-secondary text-sm px-4 py-2">
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activity found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Time</th>
                  <th className="text-left p-4 font-semibold text-gray-700">User</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Action</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Entity</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log: { id: string; action: string; entity: string | null; entityId: string | null; details: unknown; createdAt: Date; user: { firstName: string | null; lastName: string | null; email: string } | null }) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-navy-900 text-xs">
                            {log.user.firstName} {log.user.lastName}
                          </p>
                          <p className="text-gray-400 text-xs">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">System</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          actionColors[log.action] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-xs">
                      {(() => {
                        const link = entityLink(log.entity, log.entityId);
                        return link ? (
                          <Link href={link} className="text-crimson-500 hover:underline font-medium">
                            {log.entity} <span className="text-gray-400 font-mono">#{(log.entityId ?? "").slice(0, 8)}</span>
                          </Link>
                        ) : (
                          <>
                            {log.entity}
                            {log.entityId && (
                              <span className="text-gray-400 ml-1 font-mono">
                                #{log.entityId.slice(0, 8)}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-gray-600 text-xs max-w-xs">
                      {renderDetails(log.action, log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} · {total} events
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/activity-log?page=${page - 1}&action=${action}&search=${search}`}
                  className="btn-secondary text-sm px-4 py-1.5"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/activity-log?page=${page + 1}&action=${action}&search=${search}`}
                  className="btn-primary text-sm px-4 py-1.5"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
