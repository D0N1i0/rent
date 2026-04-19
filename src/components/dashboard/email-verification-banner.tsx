"use client";
// Shown in the dashboard when the user's email is not yet verified.
// Non-blocking — the user can dismiss it and continue using the app.

import { useState } from "react";
import { Mail, X, Loader2, CheckCircle } from "lucide-react";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (dismissed) return null;

  const handleResend = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="page-container py-2.5 flex items-center gap-3 flex-wrap">
        <Mail className="h-4 w-4 text-amber-600 shrink-0" />

        {status === "sent" ? (
          <span className="flex items-center gap-1.5 text-sm text-amber-800 flex-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Verification email sent — check your inbox.
          </span>
        ) : (
          <span className="text-sm text-amber-800 flex-1">
            <strong>Verify your email</strong> — check your inbox for a verification link.{" "}
            <button
              onClick={handleResend}
              disabled={status === "sending"}
              className="underline hover:no-underline font-medium disabled:opacity-60 inline-flex items-center gap-1"
            >
              {status === "sending" && <Loader2 className="h-3 w-3 animate-spin" />}
              {status === "error" ? "Failed — try again" : "Resend"}
            </button>
          </span>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
