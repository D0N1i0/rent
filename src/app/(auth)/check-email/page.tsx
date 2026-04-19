"use client";
// src/app/(auth)/check-email/page.tsx
// Shown immediately after registration to prompt the user to verify their inbox.

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Mail, CheckCircle, Loader2, AlertCircle, Car } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setStatus("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Failed to resend. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-display text-2xl font-bold text-navy-900">Auto</span>
              <span className="font-display text-2xl font-bold text-crimson-500">Kos</span>
            </div>
          </Link>

          <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>

          <h1 className="text-xl font-bold text-navy-900 mb-2">Check your inbox</h1>
          <p className="text-gray-500 text-sm mb-1">
            We sent a verification link to
          </p>
          {email && (
            <p className="font-semibold text-navy-900 text-sm mb-5 break-all">{email}</p>
          )}
          <p className="text-gray-500 text-sm mb-6">
            Click the link in the email to verify your account. The link expires in 24 hours.
          </p>

          {status === "sent" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 flex items-center gap-2 text-left">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">Verification email resent. Check your inbox.</p>
            </div>
          )}
          {status === "error" && errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-center gap-2 text-left">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="btn-primary w-full py-3 block"
            >
              Continue to Dashboard
            </Link>

            {status !== "sent" && (
              <button
                onClick={handleResend}
                disabled={status === "sending" || !email}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:text-navy-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "sending" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  "Resend verification email"
                )}
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-6">
            Didn&apos;t receive the email? Check your spam folder, or contact{" "}
            <Link href="/contact" className="underline hover:text-navy-900">
              support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
