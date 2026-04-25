"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Plus } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface CalendarCar {
  id: string;
  name: string;
  brand: string;
  model: string;
  categoryId: string;
  category: { id: string; name: string };
}

interface CalendarBooking {
  id: string;
  bookingRef: string;
  carId: string;
  status: string;
  pickupDateTime: string;
  dropoffDateTime: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  totalAmount: number;
}

interface CalendarBlock {
  id: string;
  carId: string;
  reason: string | null;
  startDate: string;
  endDate: string;
}

interface CalendarData {
  from: string;
  to: string;
  cars: CalendarCar[];
  bookings: CalendarBooking[];
  availabilityBlocks: CalendarBlock[];
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  allCars: { id: string; name: string; brand: string }[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const COL_W = 38; // px per day column
const ROW_H = 44; // px per car row
const CAR_COL_W = 180; // px for car name column

const ALL_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "REJECTED"] as const;

type BookingStatus = typeof ALL_STATUSES[number];

// Status → { bar bg, text, label }
const STATUS_CONFIG: Record<string, { bar: string; label: string }> = {
  PENDING:     { bar: "bg-amber-400 border border-amber-500",   label: "Pending" },
  CONFIRMED:   { bar: "bg-blue-500 border border-blue-600",     label: "Confirmed" },
  IN_PROGRESS: { bar: "bg-emerald-500 border border-emerald-600", label: "Active" },
  COMPLETED:   { bar: "bg-gray-400 border border-gray-500",     label: "Completed" },
  CANCELLED:   { bar: "bg-red-300 border border-red-400",       label: "Cancelled" },
  NO_SHOW:     { bar: "bg-orange-400 border border-orange-500", label: "No-show" },
  REJECTED:    { bar: "bg-red-500 border border-red-600",       label: "Rejected" },
  BLOCK:       { bar: "bg-slate-300 border border-slate-400",   label: "Blocked" },
};

const STATUS_TEXT: Record<string, string> = {
  PENDING:     "text-amber-900",
  CONFIRMED:   "text-white",
  IN_PROGRESS: "text-white",
  COMPLETED:   "text-white",
  CANCELLED:   "text-red-900",
  NO_SHOW:     "text-orange-900",
  REJECTED:    "text-white",
  BLOCK:       "text-slate-700",
};

// ── Date helpers ─────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(fromStr: string, toStr: string): number {
  const a = new Date(fromStr + "T00:00:00Z");
  const b = new Date(toStr + "T00:00:00Z");
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

function dateToStr(iso: string): string {
  return iso.slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T00:00:00Z").getUTCDay(); // 0=Sun
}

function isWeekend(dateStr: string): boolean {
  const d = getDayOfWeek(dateStr);
  return d === 0 || d === 6;
}

function generateDays(fromStr: string, toStr: string): string[] {
  const days: string[] = [];
  let cur = fromStr;
  while (cur <= toStr) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

// ── Month header segments ────────────────────────────────────────────────────

function buildMonthSegments(days: string[]): { label: string; span: number }[] {
  const segs: { label: string; span: number }[] = [];
  for (const day of days) {
    const label = formatMonthYear(day);
    if (segs.length === 0 || segs[segs.length - 1].label !== label) {
      segs.push({ label, span: 1 });
    } else {
      segs[segs.length - 1].span++;
    }
  }
  return segs;
}

// ── Component ────────────────────────────────────────────────────────────────

export function AvailabilityCalendarClient({ categories, allCars }: Props) {
  const defaultFrom = todayStr();
  const defaultTo = addDays(defaultFrom, 27);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [carId, setCarId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close status dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from, to });
      if (carId) params.set("carId", carId);
      if (categoryId) params.set("categoryId", categoryId);
      const res = await fetch(`/api/admin/availability-calendar?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load calendar");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [from, to, carId, categoryId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Navigate the window ±14 days
  function shiftWindow(days: number) {
    const span = diffDays(from, to);
    const newFrom = addDays(from, days);
    const newTo = addDays(newFrom, span);
    setFrom(newFrom);
    setTo(newTo);
  }

  // Jump to today
  function jumpToToday() {
    const span = diffDays(from, to);
    const newFrom = todayStr();
    setFrom(newFrom);
    setTo(addDays(newFrom, span));
  }

  const today = todayStr();
  const days = data ? generateDays(data.from, data.to) : [];
  const numDays = days.length;
  const monthSegments = buildMonthSegments(days);

  // Filter bookings by status
  const visibleBookings = data?.bookings.filter(
    (b) => statusFilter.length === 0 || statusFilter.includes(b.status)
  ) ?? [];

  // Build lookup: carId → bookings/blocks
  const bookingsByCarId = new Map<string, CalendarBooking[]>();
  const blocksByCarId = new Map<string, CalendarBlock[]>();
  for (const b of visibleBookings) {
    if (!bookingsByCarId.has(b.carId)) bookingsByCarId.set(b.carId, []);
    bookingsByCarId.get(b.carId)!.push(b);
  }
  for (const bl of data?.availabilityBlocks ?? []) {
    if (!blocksByCarId.has(bl.carId)) blocksByCarId.set(bl.carId, []);
    blocksByCarId.get(bl.carId)!.push(bl);
  }

  // Compute pixel offsets for a date range within the grid
  function barGeometry(startIso: string, endIso: string): { left: number; width: number } | null {
    if (!data) return null;
    const startDay = dateToStr(startIso);
    const endDay = dateToStr(endIso);
    const rawStart = diffDays(data.from, startDay);
    const rawEnd = diffDays(data.from, endDay);
    const clampedStart = Math.max(0, rawStart);
    const clampedEnd = Math.min(numDays, Math.max(clampedStart + 1, rawEnd));
    if (clampedStart >= numDays || clampedEnd <= 0) return null;
    return {
      left: clampedStart * COL_W,
      width: Math.max(4, (clampedEnd - clampedStart) * COL_W - 2),
    };
  }

  function toggleStatus(s: string) {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const gridWidth = numDays * COL_W;
  const todayOffset = data ? diffDays(data.from, today) : -1;
  const todayInRange = todayOffset >= 0 && todayOffset < numDays;

  return (
    <div className="space-y-4">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Availability Calendar</h1>
          <p className="text-gray-500 text-sm mt-0.5">Fleet schedule overview — bookings and maintenance blocks</p>
        </div>
        <Link href="/admin/bookings/new" className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Date range */}
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="form-input text-sm py-1.5 px-2"
              />
            </div>
            <span className="text-gray-400 mt-5">–</span>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="form-input text-sm py-1.5 px-2"
              />
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1 mt-auto">
            <button
              onClick={() => shiftWindow(-14)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Back 14 days"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={jumpToToday}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => shiftWindow(14)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Forward 14 days"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="form-input text-sm py-1.5 px-2"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Car filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Vehicle</label>
            <select
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              className="form-input text-sm py-1.5 px-2"
            >
              <option value="">All vehicles</option>
              {allCars.map((c) => (
                <option key={c.id} value={c.id}>{c.brand} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div ref={statusMenuRef} className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <button
              type="button"
              onClick={() => setShowStatusMenu((v) => !v)}
              className="form-input text-sm py-1.5 px-2 min-w-[140px] text-left flex items-center justify-between gap-2"
            >
              <span>
                {statusFilter.length === 0
                  ? "All statuses"
                  : `${statusFilter.length} selected`}
              </span>
              <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showStatusMenu ? "rotate-90" : ""}`} />
            </button>
            {showStatusMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-20 w-44 py-1">
                {ALL_STATUSES.map((s) => (
                  <label key={s} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(s)}
                      onChange={() => toggleStatus(s)}
                      className="rounded border-gray-300 text-navy-900 focus:ring-navy-900 h-3.5 w-3.5"
                    />
                    <span className={`inline-block h-2.5 w-2.5 rounded-sm ${STATUS_CONFIG[s]?.bar ?? "bg-gray-300"}`} />
                    <span className="text-xs text-gray-700">{STATUS_CONFIG[s]?.label ?? s}</span>
                  </label>
                ))}
                {statusFilter.length > 0 && (
                  <button
                    onClick={() => setStatusFilter([])}
                    className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-gray-50 border-t border-gray-100 mt-1"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="mt-auto p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-5 rounded-sm ${cfg.bar}`} />
            <span className="text-gray-600">{cfg.label}</span>
          </span>
        ))}
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Calendar grid ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading && !data && (
          <div className="p-12 text-center text-gray-400 text-sm">Loading calendar…</div>
        )}

        {data && (
          <div
            ref={gridRef}
            className="overflow-x-auto"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            <div style={{ minWidth: CAR_COL_W + gridWidth }}>
              {/* ── Month header ── */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                <div
                  className="shrink-0 border-r border-gray-200 bg-gray-50 sticky left-0 z-10"
                  style={{ width: CAR_COL_W }}
                />
                <div className="flex">
                  {monthSegments.map((seg, i) => (
                    <div
                      key={i}
                      className="text-xs font-semibold text-gray-600 px-2 py-1.5 border-r border-gray-200 truncate"
                      style={{ width: seg.span * COL_W }}
                    >
                      {seg.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Day header ── */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                <div
                  className="shrink-0 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200 sticky left-0 z-10 bg-gray-50"
                  style={{ width: CAR_COL_W }}
                >
                  Vehicle
                </div>
                <div className="flex relative">
                  {days.map((day, i) => {
                    const isToday = day === today;
                    const weekend = isWeekend(day);
                    return (
                      <div
                        key={day}
                        className={`flex flex-col items-center justify-center text-xs border-r border-gray-100 select-none
                          ${isToday ? "bg-navy-900 text-white font-bold" : weekend ? "bg-gray-50 text-gray-400" : "text-gray-500"}`}
                        style={{ width: COL_W, minHeight: 36 }}
                      >
                        <span>{new Date(day + "T00:00:00Z").getUTCDate()}</span>
                        <span className="text-[9px] opacity-70 leading-none">
                          {["Su","Mo","Tu","We","Th","Fr","Sa"][new Date(day + "T00:00:00Z").getUTCDay()]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Car rows ── */}
              {data.cars.length === 0 && (
                <div className="p-12 text-center text-gray-400 text-sm">
                  No vehicles match the current filters.
                </div>
              )}

              {data.cars.map((car, rowIdx) => {
                const carBookings = bookingsByCarId.get(car.id) ?? [];
                const carBlocks = blocksByCarId.get(car.id) ?? [];

                return (
                  <div
                    key={car.id}
                    className={`flex border-b border-gray-100 ${rowIdx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}
                    style={{ height: ROW_H }}
                  >
                    {/* Car name — sticky */}
                    <div
                      className={`shrink-0 flex items-center px-3 border-r border-gray-200 ${rowIdx % 2 === 1 ? "bg-gray-50" : "bg-white"} sticky left-0 z-10`}
                      style={{ width: CAR_COL_W }}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-navy-900 truncate">{car.brand} {car.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{car.category.name}</p>
                      </div>
                    </div>

                    {/* Grid area */}
                    <div className="relative" style={{ width: gridWidth, minWidth: gridWidth }}>
                      {/* Day background cells + "click to create" targets */}
                      {days.map((day, i) => {
                        const isToday = day === today;
                        const weekend = isWeekend(day);
                        return (
                          <Link
                            key={day}
                            href={`/admin/bookings/new?carId=${car.id}&pickupDate=${day}`}
                            className={`absolute top-0 bottom-0 border-r border-gray-100 hover:bg-blue-50/60 transition-colors
                              ${isToday ? "bg-navy-50/30" : weekend ? "bg-gray-50/50" : ""}`}
                            style={{ left: i * COL_W, width: COL_W }}
                            title={`Create booking — ${car.brand} ${car.name} on ${formatDisplayDate(day)}`}
                            tabIndex={-1}
                          />
                        );
                      })}

                      {/* Today indicator line */}
                      {todayInRange && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-navy-900/30 z-20 pointer-events-none"
                          style={{ left: todayOffset * COL_W + COL_W / 2 }}
                        />
                      )}

                      {/* Availability blocks */}
                      {carBlocks.map((bl) => {
                        const geo = barGeometry(bl.startDate, bl.endDate);
                        if (!geo) return null;
                        const label = bl.reason ?? "Maintenance";
                        return (
                          <Link
                            key={bl.id}
                            href="/admin/availability-blocks"
                            className={`absolute top-2 rounded text-xs font-medium flex items-center px-1.5 overflow-hidden whitespace-nowrap z-10
                              ${STATUS_CONFIG.BLOCK.bar} ${STATUS_TEXT.BLOCK}`}
                            style={{ left: geo.left, width: geo.width, height: ROW_H - 16 }}
                            title={`Block: ${label}`}
                          >
                            {geo.width >= 60 ? (
                              <span className="truncate">🔧 {label}</span>
                            ) : geo.width >= 20 ? (
                              <span>🔧</span>
                            ) : null}
                          </Link>
                        );
                      })}

                      {/* Bookings */}
                      {carBookings.map((b) => {
                        const geo = barGeometry(b.pickupDateTime, b.dropoffDateTime);
                        if (!geo) return null;
                        const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.PENDING;
                        const textCls = STATUS_TEXT[b.status] ?? "text-white";
                        const guestName = [b.guestFirstName, b.guestLastName].filter(Boolean).join(" ");
                        const tooltipText = `${b.bookingRef} · ${guestName || "Guest"} · ${cfg.label}`;
                        return (
                          <Link
                            key={b.id}
                            href={`/admin/bookings/${b.id}`}
                            className={`absolute top-2 rounded text-xs font-semibold flex items-center px-1.5 overflow-hidden whitespace-nowrap z-10 hover:opacity-90 transition-opacity
                              ${cfg.bar} ${textCls}`}
                            style={{ left: geo.left, width: geo.width, height: ROW_H - 16 }}
                            title={tooltipText}
                          >
                            {geo.width >= 80 ? (
                              <span className="truncate">{b.bookingRef}{guestName ? ` · ${guestName}` : ""}</span>
                            ) : geo.width >= 30 ? (
                              <span className="truncate">{b.bookingRef}</span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Summary ── */}
      {data && (
        <p className="text-xs text-gray-400">
          {data.cars.length} vehicle{data.cars.length !== 1 ? "s" : ""} ·{" "}
          {visibleBookings.length} booking{visibleBookings.length !== 1 ? "s" : ""}{statusFilter.length > 0 ? " (filtered)" : ""} ·{" "}
          {data.availabilityBlocks.length} block{data.availabilityBlocks.length !== 1 ? "s" : ""}{" "}
          · {data.from} → {data.to}
          {loading && " · Refreshing…"}
        </p>
      )}
    </div>
  );
}
