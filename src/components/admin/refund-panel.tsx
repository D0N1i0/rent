"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, Loader2, RotateCcw } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface RefundRecord {
  id: string;
  stripeRefundId: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string; // serialised Date
  initiatedBy: { firstName: string | null; lastName: string | null } | null;
}

interface RefundPanelProps {
  bookingId: string;
  bookingRef: string;
  totalAmount: number;
  amountRefunded: number;
  paymentStatus: string;
  hasStripePayment: boolean;
  existingRefunds: RefundRecord[];
}

type Step = "form" | "confirm" | "done";

export function RefundPanel({
  bookingId,
  bookingRef,
  totalAmount,
  amountRefunded,
  paymentStatus,
  hasStripePayment,
  existingRefunds,
}: RefundPanelProps) {
  const router = useRouter();
  const maxRefundable = +(totalAmount - amountRefunded).toFixed(2);
  const canRefund =
    hasStripePayment &&
    (paymentStatus === "PAID" || paymentStatus === "PARTIALLY_PAID") &&
    maxRefundable > 0;

  const [step, setStep] = useState<Step>("form");
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [amountStr, setAmountStr] = useState(maxRefundable.toFixed(2));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ stripeRefundId: string; amount: number; isFullRefund: boolean } | null>(null);

  const parsedAmount = parseFloat(amountStr);
  const amountValid =
    !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= maxRefundable;
  const reasonValid = reason.trim().length >= 5;
  const canSubmit = amountValid && reasonValid;

  function handleTypeChange(type: "full" | "partial") {
    setRefundType(type);
    if (type === "full") setAmountStr(maxRefundable.toFixed(2));
    setError(null);
  }

  function handleAmountChange(v: string) {
    setAmountStr(v);
    setError(null);
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, amount: parsedAmount, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Refund failed. Please try again.");
        setStep("form");
        return;
      }
      setResult({ stripeRefundId: data.stripeRefundId, amount: data.amountRefunded, isFullRefund: data.isFullRefund });
      setStep("done");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  const showHistory = existingRefunds.length > 0 || step === "done";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <RotateCcw className="h-5 w-5 text-gray-400" />
        <h2 className="font-bold text-navy-900">Refunds</h2>
        {amountRefunded > 0 && (
          <span className="ml-auto text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
            {formatCurrency(amountRefunded)} refunded
          </span>
        )}
      </div>

      {/* ── Refund form / confirm / done ─────────────────────────────────── */}
      {canRefund && step === "form" && (
        <div className="space-y-4">
          {/* Balance summary */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Paid</p>
              <p className="font-bold text-navy-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Refunded</p>
              <p className="font-bold text-amber-700">{formatCurrency(amountRefunded)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Refundable</p>
              <p className="font-bold text-green-700">{formatCurrency(maxRefundable)}</p>
            </div>
          </div>

          {/* Full / partial toggle */}
          <div className="flex gap-3">
            {(["full", "partial"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  refundType === t
                    ? "bg-navy-900 text-white border-navy-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {t === "full" ? `Full refund (${formatCurrency(maxRefundable)})` : "Partial refund"}
              </button>
            ))}
          </div>

          {/* Amount input — always shown, locked for full refund */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Amount (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxRefundable}
              value={amountStr}
              readOnly={refundType === "full"}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 ${
                refundType === "full"
                  ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                  : "bg-white"
              } ${!amountValid && amountStr !== "" ? "border-red-400" : "border-gray-200"}`}
            />
            {!amountValid && amountStr !== "" && (
              <p className="text-xs text-red-600 mt-1">
                Enter an amount between €0.01 and {formatCurrency(maxRefundable)}.
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reason <span className="text-gray-400">(min 5 characters, sent to customer)</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Booking cancelled by customer before pickup"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 resize-none ${
                !reasonValid && reason !== "" ? "border-red-400" : "border-gray-200"
              }`}
            />
            {!reasonValid && reason !== "" && (
              <p className="text-xs text-red-600 mt-1">Reason must be at least 5 characters.</p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            disabled={!canSubmit}
            onClick={() => setStep("confirm")}
            className="w-full bg-crimson-600 hover:bg-crimson-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            Review Refund
          </button>
        </div>
      )}

      {/* ── Confirm step ─────────────────────────────────────────────────── */}
      {canRefund && step === "confirm" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-bold text-amber-900">Confirm refund for booking {bookingRef}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-amber-800">
              <span className="text-amber-600">Amount:</span>
              <span className="font-bold text-lg">{formatCurrency(parsedAmount)}</span>
              <span className="text-amber-600">Type:</span>
              <span>{refundType === "full" ? "Full refund" : "Partial refund"}</span>
              <span className="text-amber-600">Reason:</span>
              <span className="italic">"{reason.trim()}"</span>
            </div>
            <p className="text-xs text-amber-700 mt-2">
              This will immediately issue a refund via Stripe. This action cannot be undone.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              disabled={loading}
              onClick={() => { setStep("form"); setError(null); }}
              className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              disabled={loading}
              onClick={handleConfirm}
              className="flex-1 bg-crimson-600 hover:bg-crimson-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Processing…" : "Confirm & Refund"}
            </button>
          </div>
        </div>
      )}

      {/* ── Success ──────────────────────────────────────────────────────── */}
      {step === "done" && result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm space-y-1">
          <div className="flex items-center gap-2 text-green-800 font-bold">
            <CheckCircle className="h-5 w-5" />
            Refund issued successfully
          </div>
          <p className="text-green-700">
            {formatCurrency(result.amount)} {result.isFullRefund ? "full refund" : "partial refund"} processed.
            The customer will receive an email confirmation.
          </p>
          <p className="text-xs text-green-600 font-mono mt-1">{result.stripeRefundId}</p>
        </div>
      )}

      {/* ── No Stripe payment notice ──────────────────────────────────────── */}
      {!hasStripePayment && (
        <p className="text-sm text-gray-500">
          No Stripe payment on file. Refund this booking manually via your payment processor.
        </p>
      )}

      {/* ── Already fully refunded ───────────────────────────────────────── */}
      {hasStripePayment && paymentStatus === "REFUNDED" && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle className="h-4 w-4 shrink-0" />
          This booking has been fully refunded.
        </div>
      )}

      {/* ── Refund history ───────────────────────────────────────────────── */}
      {showHistory && existingRefunds.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Refund History
          </h3>
          <div className="space-y-3">
            {existingRefunds.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy-900">{formatCurrency(r.amount)}</span>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 border font-medium ${
                        r.status === "SUCCEEDED"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5 truncate italic">"{r.reason}"</p>
                  {r.initiatedBy && (
                    <p className="text-gray-400 text-xs">
                      By: {r.initiatedBy.firstName} {r.initiatedBy.lastName}
                    </p>
                  )}
                  <p className="text-gray-400 text-xs font-mono truncate">{r.stripeRefundId}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 text-right">
                  {formatDateTime(r.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
