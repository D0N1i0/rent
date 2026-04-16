// src/components/booking/cancel-booking-button.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";

interface CancelBookingButtonProps {
  bookingId: string;
  bookingRef: string;
  hoursUntilPickup: number;
}

export function CancelBookingButton({
  bookingId,
  bookingRef,
  hoursUntilPickup,
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFreeCancellation = hoursUntilPickup >= 48;

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to cancel booking");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        <XCircle className="h-4 w-4" />
        Cancel Booking
      </button>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-4">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-800">Cancel Booking {bookingRef}?</p>
          {isFreeCancellation ? (
            <p className="text-sm text-green-700 mt-1">
              ✓ Free cancellation — more than 48 hours before pickup. No fee applies.
            </p>
          ) : (
            <p className="text-sm text-orange-700 mt-1">
              ⚠ Less than 48 hours until pickup. A cancellation fee may apply per our policy.
            </p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
          Reason (optional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Tell us why you're cancelling (optional)..."
          className="form-input resize-none text-sm"
          maxLength={500}
        />
      </div>

      {error && (
        <p className="text-sm text-red-700 mb-3 bg-red-100 rounded-lg p-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</>
          ) : (
            <><XCircle className="h-4 w-4" /> Confirm Cancellation</>
          )}
        </button>
        <button
          onClick={() => { setShowConfirm(false); setError(null); }}
          className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Keep Booking
        </button>
      </div>
    </div>
  );
}
