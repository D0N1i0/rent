"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminError]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mb-4">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Error</h2>
        <p className="text-gray-500 text-sm mb-6">
          {error.message || "An unexpected error occurred in the admin panel."}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-navy-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-800 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/admin/dashboard"
            className="border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
