"use client";
import { useState, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExtraPricingType } from "@prisma/client";
import { PhoneInput } from "@/components/ui/phone-input";

interface Car {
  id: string;
  name: string;
  brand: string;
  model: string;
  pricePerDay: number;
  deposit: number;
  hasSeasonalPricing: boolean;
}

interface PickupLocation {
  id: string;
  name: string;
  pickupFee: number;
}

interface DropoffLocation {
  id: string;
  name: string;
  dropoffFee: number;
}

interface Extra {
  id: string;
  name: string;
  price: number;
  pricingType: ExtraPricingType;
}

interface Props {
  cars: Car[];
  pickupLocations: PickupLocation[];
  dropoffLocations: DropoffLocation[];
  extras: Extra[];
  defaultCarId?: string;
  defaultPickupDate?: string;
}

interface PriceBreakdown {
  durationDays: number;
  pricePerDay: number;
  subtotal: number;
  extrasTotal: number;
  pickupFee: number;
  dropoffFee: number;
  discount: number;
  preTaxTotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  pricingTier: string;
}

function fmt(n: number) {
  return "€" + n.toFixed(2);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function addOneDayStr(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function ManualBookingForm({ cars, pickupLocations, dropoffLocations, extras, defaultCarId = "", defaultPickupDate = "" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [carId, setCarId] = useState(defaultCarId);
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [dropoffLocationId, setDropoffLocationId] = useState("");
  const [pickupDate, setPickupDate] = useState(defaultPickupDate || today());
  const [pickupTime, setPickupTime] = useState("09:00");
  const [returnDate, setReturnDate] = useState(defaultPickupDate ? addOneDayStr(defaultPickupDate) : tomorrow());
  const [returnTime, setReturnTime] = useState("09:00");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState("");

  const [userId, setUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [status, setStatus] = useState<"PENDING" | "CONFIRMED">("CONFIRMED");
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(false);

  // ── Preview state ───────────────────────────────────────────────────────────
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [couponValid, setCouponValid] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // ── Submission state ────────────────────────────────────────────────────────
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdRef, setCreatedRef] = useState<string | null>(null);

  // ── Fetch price preview ─────────────────────────────────────────────────────
  const fetchPreview = useCallback(async () => {
    if (!carId || !pickupLocationId || !dropoffLocationId || !pickupDate || !returnDate) {
      setBreakdown(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/admin/bookings/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          pickupLocationId,
          dropoffLocationId,
          pickupDate,
          pickupTime,
          returnDate,
          returnTime,
          selectedExtras,
          couponCode: couponCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error ?? "Could not load price preview");
        setBreakdown(null);
      } else {
        setBreakdown(data.breakdown);
        setCouponValid(data.couponValid);
        setCouponError(data.couponError ?? null);
      }
    } catch {
      setPreviewError("Network error loading preview");
    } finally {
      setPreviewLoading(false);
    }
  }, [carId, pickupLocationId, dropoffLocationId, pickupDate, pickupTime, returnDate, returnTime, selectedExtras, couponCode]);

  useEffect(() => {
    const id = setTimeout(fetchPreview, 400);
    return () => clearTimeout(id);
  }, [fetchPreview]);

  // ── Toggle extra ────────────────────────────────────────────────────────────
  function toggleExtra(id: string) {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            carId,
            pickupLocationId,
            dropoffLocationId,
            pickupDate,
            pickupTime,
            returnDate,
            returnTime,
            selectedExtras,
            couponCode: couponCode.trim(),
            userId: userId.trim() || undefined,
            firstName,
            lastName,
            email,
            phone,
            idNumber,
            licenseNumber,
            nationality,
            specialRequests,
            internalNotes,
            status,
            sendConfirmationEmail,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSubmitError(data.error ?? "Failed to create booking");
        } else {
          setCreatedRef(data.bookingRef);
          router.push(`/admin/bookings/${data.bookingId}`);
        }
      } catch {
        setSubmitError("Network error. Please try again.");
      }
    });
  }

  if (createdRef) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="text-green-600 text-2xl font-bold mb-2">Booking Created</div>
        <p className="text-gray-500">Ref: <span className="font-mono font-semibold">{createdRef}</span></p>
        <p className="text-gray-400 text-sm mt-1">Redirecting…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Vehicle & Dates ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-navy-900 text-base">Vehicle & Dates</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
            <select
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              required
              className="form-input"
            >
              <option value="">Select vehicle…</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand} {c.name} — {fmt(c.pricePerDay)}/day
                  {c.hasSeasonalPricing ? " (seasonal)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location *</label>
            <select
              value={pickupLocationId}
              onChange={(e) => setPickupLocationId(e.target.value)}
              required
              className="form-input"
            >
              <option value="">Select location…</option>
              {pickupLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}{l.pickupFee > 0 ? ` (+${fmt(l.pickupFee)})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drop-off Location *</label>
            <select
              value={dropoffLocationId}
              onChange={(e) => setDropoffLocationId(e.target.value)}
              required
              className="form-input"
            >
              <option value="">Select location…</option>
              {dropoffLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}{l.dropoffFee > 0 ? ` (+${fmt(l.dropoffFee)})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
            <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time *</label>
            <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} required className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Date *</label>
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Time *</label>
            <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} required className="form-input" />
          </div>
        </div>
      </section>

      {/* ── Extras & Coupon ── */}
      {extras.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-navy-900 text-base">Extras & Coupon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {extras.map((e) => (
              <label key={e.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(e.id)}
                  onChange={() => toggleExtra(e.id)}
                  className="rounded border-gray-300 text-navy-900 focus:ring-navy-900"
                />
                <span className="text-sm text-gray-700">
                  {e.name} — {fmt(e.price)}{e.pricingType === "PER_DAY" ? "/day" : ""}
                </span>
              </label>
            ))}
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER10"
              className="form-input uppercase"
            />
            {couponCode && (
              <p className={`text-xs mt-1 ${couponValid ? "text-green-600" : "text-red-500"}`}>
                {couponValid ? "Coupon applied" : (couponError ?? "Checking…")}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Price Preview ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-navy-900 text-base mb-4">Price Preview</h2>
        {previewLoading && <p className="text-gray-400 text-sm">Calculating…</p>}
        {previewError && <p className="text-red-500 text-sm">{previewError}</p>}
        {breakdown && !previewLoading && (
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{fmt(breakdown.pricePerDay)}/day × {breakdown.durationDays} day{breakdown.durationDays !== 1 ? "s" : ""}</span>
              <span>{fmt(breakdown.subtotal)}</span>
            </div>
            {breakdown.extrasTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Extras</span>
                <span>{fmt(breakdown.extrasTotal)}</span>
              </div>
            )}
            {breakdown.pickupFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Pickup fee</span>
                <span>{fmt(breakdown.pickupFee)}</span>
              </div>
            )}
            {breakdown.dropoffFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Drop-off fee</span>
                <span>{fmt(breakdown.dropoffFee)}</span>
              </div>
            )}
            {breakdown.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−{fmt(breakdown.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>VAT ({Math.round(breakdown.vatRate * 100)}%)</span>
              <span>{fmt(breakdown.vatAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-navy-900 border-t border-gray-100 pt-2 mt-2">
              <span>Total</span>
              <span>{fmt(breakdown.totalAmount)}</span>
            </div>
            <p className="text-xs text-gray-400 pt-1">
              {breakdown.pricingTier === "seasonal"
                ? "Seasonal rate applied"
                : breakdown.pricingTier === "monthly"
                ? "Monthly rate applied"
                : breakdown.pricingTier === "weekly"
                ? "Weekly rate applied"
                : "Daily rate"}
            </p>
          </div>
        )}
        {!breakdown && !previewLoading && !previewError && (
          <p className="text-gray-400 text-sm">Select a vehicle, locations, and dates to see the price.</p>
        )}
      </section>

      {/* ── Customer Details ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-navy-900 text-base">Customer Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link to existing account (optional)
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID (from admin users list)"
            className="form-input font-mono text-xs"
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank for guest booking.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required minLength={2} maxLength={50} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required minLength={2} maxLength={50} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID / Passport Number *</label>
            <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required minLength={3} maxLength={50} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driving Licence Number *</label>
            <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required minLength={3} maxLength={50} className="form-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} maxLength={80} className="form-input" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
          <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} maxLength={500} rows={2} className="form-input resize-none" />
        </div>
      </section>

      {/* ── Admin Options ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-navy-900 text-base">Admin Options</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
          <textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Walk-in customer, paid cash at desk…"
            className="form-input resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">Not visible to the customer.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Initial Status</label>
          <div className="flex gap-4">
            {(["PENDING", "CONFIRMED"] as const).map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                  className="text-navy-900 focus:ring-navy-900"
                />
                <span className="text-sm text-gray-700">{s}</span>
              </label>
            ))}
          </div>
          {status === "CONFIRMED" && (
            <p className="text-xs text-amber-600 mt-1">
              CONFIRMED status does not mark the booking as paid — payment status will be UNPAID.
            </p>
          )}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sendConfirmationEmail}
            onChange={(e) => setSendConfirmationEmail(e.target.checked)}
            className="rounded border-gray-300 text-navy-900 focus:ring-navy-900"
          />
          <span className="text-sm text-gray-700">Send booking confirmation email to customer</span>
        </label>
      </section>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="flex items-center gap-3 pb-4">
        <button
          type="submit"
          disabled={isPending || previewLoading}
          className="btn-primary px-6 py-2.5 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating…" : "Create Booking"}
        </button>
        <a href="/admin/bookings" className="btn-secondary px-6 py-2.5 text-sm font-medium">
          Cancel
        </a>
        {breakdown && (
          <span className="ml-auto text-sm font-semibold text-navy-900">
            Total: {fmt(breakdown.totalAmount)}
          </span>
        )}
      </div>
    </form>
  );
}
