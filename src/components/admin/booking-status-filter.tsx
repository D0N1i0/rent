// src/components/admin/booking-status-filter.tsx
"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface BookingStatusFilterProps {
  current?: string;
  counts: Array<{ status: string; _count: { status: number } }>;
  total: number;
}

export function BookingStatusFilter({ current, counts, total }: BookingStatusFilterProps) {
  const allStatuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  const getCount = (status: string) => counts.find(c => c.status === status)?._count.status ?? 0;

  const tabs = [
    { label: "All", value: "", count: total },
    ...allStatuses.map(s => ({ label: s.charAt(0) + s.slice(1).toLowerCase().replace("_", " "), value: s, count: getCount(s) })),
  ];

  return (
    <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 overflow-x-auto scrollbar-hide">
      {tabs.map(tab => (
        <Link
          key={tab.value}
          href={`/admin/bookings${tab.value ? `?status=${tab.value}` : ""}`}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
            (!current && !tab.value) || current === tab.value
              ? "bg-navy-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {tab.label}
          <span className={cn("text-xs rounded-full px-1.5 py-0.5", (!current && !tab.value) || current === tab.value ? "bg-white/20" : "bg-gray-100")}>
            {tab.count}
          </span>
        </Link>
      ))}
    </div>
  );
}
