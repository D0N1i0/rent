"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log to console in dev; swap for a real logger (Sentry, etc.) in prod
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white text-gray-900">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-2">
              An unexpected error occurred. Our team has been notified.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 font-mono mb-6">Error ID: {error.digest}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
              >
                <Home className="h-4 w-4" />
                Back to homepage
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
