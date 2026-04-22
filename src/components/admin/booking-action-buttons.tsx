// src/components/admin/booking-action-buttons.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, Loader2, DollarSign, Check,
  Play, AlertOctagon, Flag, AlertCircle,
} from "lucide-react";

interface BookingActionButtonsProps {
  bookingId: string;
  currentStatus: string;
  currentPaymentStatus: string;
}

export function BookingActionButtons({
  bookingId,
  currentStatus,
  currentPaymentStatus,
}: BookingActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Modal state for actions needing a reason
  const [reasonModal, setReasonModal] = useState<{
    action: string;
    payload: Record<string, unknown>;
    label: string;
    prompt: string;
    reasonKey: string;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    action: string;
    payload: Record<string, unknown>;
    label: string;
    description: string;
    tone?: "default" | "danger";
  } | null>(null);
  const [reason, setReason] = useState("");

  const update = async (payload: Record<string, unknown>, actionKey: string) => {
    setLoading(actionKey);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Action failed. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const openReasonModal = (
    action: string,
    payload: Record<string, unknown>,
    label: string,
    prompt: string,
    reasonKey: string
  ) => {
    setReason("");
    setError(null);
    setReasonModal({ action, payload, label, prompt, reasonKey });
  };

  const submitWithReason = async () => {
    if (!reasonModal) return;
    const { payload, action, reasonKey } = reasonModal;
    setReasonModal(null);
    await update({ ...payload, [reasonKey]: reason.trim() || undefined }, action);
  };

  const openConfirmModal = (
    action: string,
    payload: Record<string, unknown>,
    label: string,
    description: string,
    tone: "default" | "danger" = "default"
  ) => {
    setError(null);
    setConfirmModal({ action, payload, label, description, tone });
  };

  const submitConfirmedAction = async () => {
    if (!confirmModal) return;
    const { payload, action } = confirmModal;
    setConfirmModal(null);
    await update(payload, action);
  };

  const btn = (key: string) => loading === key;

  return (
    <>
      <div className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {currentStatus === "PENDING" && (
            <button
              onClick={() => openConfirmModal("confirm", { status: "CONFIRMED" }, "Confirm Booking", "This will confirm the reservation and notify the customer.")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {btn("confirm") ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Confirm
            </button>
          )}

          {currentStatus === "PENDING" && (
            <button
              onClick={() => openReasonModal("reject", { status: "REJECTED" }, "Reject Booking", "Reason for rejection (optional — sent to customer):", "rejectionReason")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {btn("reject") ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertOctagon className="h-4 w-4" />}
              Reject
            </button>
          )}

          {currentStatus === "CONFIRMED" && (
            <button
              onClick={() => openConfirmModal("pickup", { status: "IN_PROGRESS" }, "Mark Picked Up", "This starts the rental and records the actual pickup time.")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {btn("pickup") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Mark Picked Up
            </button>
          )}

          {currentStatus === "IN_PROGRESS" && (
            <button
              onClick={() => openConfirmModal("complete", { status: "COMPLETED" }, "Mark Returned", "This completes the rental and records the actual return time.")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {btn("complete") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
              Mark Returned
            </button>
          )}

          {currentStatus === "IN_PROGRESS" && (
            <button
              onClick={() => openConfirmModal("noshow", { status: "NO_SHOW" }, "Mark No Show", "This marks the customer as a no-show. Use only after the pickup window has passed.", "danger")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {btn("noshow") ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertOctagon className="h-4 w-4" />}
              No Show
            </button>
          )}

          {["PENDING", "CONFIRMED"].includes(currentStatus) && (
            <button
              onClick={() => openReasonModal("cancel", { status: "CANCELLED" }, "Cancel Booking", "Reason for cancellation (optional — sent to customer):", "cancellationReason")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {btn("cancel") ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel
            </button>
          )}

          {currentPaymentStatus !== "PAID" && currentStatus !== "CANCELLED" && (
            <button
              onClick={() => openConfirmModal("markpaid", { paymentStatus: "PAID" }, "Mark Payment Received", "This records the booking as paid manually. Confirm only after reconciling cash, card terminal, bank transfer, or Stripe.")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {btn("markpaid") ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              Mark Paid
            </button>
          )}

          {currentPaymentStatus === "PAID" && (
            <button
              onClick={() => openConfirmModal("refund", { paymentStatus: "REFUNDED" }, "Mark Refunded", "This records the payment as refunded manually. Confirm only after the refund has actually been issued.", "danger")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {btn("refund") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Mark Refunded
            </button>
          )}

          {currentStatus === "COMPLETED" && (
            <button
              onClick={() => openConfirmModal("deposit", { depositReturned: true }, "Deposit Returned", "This records the security deposit as returned to the customer.")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {btn("deposit") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Deposit Returned
            </button>
          )}
        </div>
      </div>

      {/* Reason modal */}
      {reasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-navy-900 mb-1">{reasonModal.label}</h3>
            <p className="text-sm text-gray-500 mb-4">{reasonModal.prompt}</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional — leave blank to proceed without a reason"
              rows={3}
              className="form-input resize-none w-full mb-4 text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setReasonModal(null)}
                className="flex-1 btn-secondary py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitWithReason}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-navy-900 mb-1">{confirmModal.label}</h3>
            <p className="text-sm text-gray-500 mb-5">{confirmModal.description}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 btn-secondary py-2.5 text-sm"
              >
                Back
              </button>
              <button
                onClick={submitConfirmedAction}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
                  confirmModal.tone === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-navy-900 hover:bg-navy-800"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
