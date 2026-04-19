import Link from "next/link";
import { Car, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="h-20 w-20 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Car className="h-10 w-10 text-white" />
        </div>
        <h1 className="font-display text-6xl font-bold text-navy-900 mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-700 mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-navy-900 text-white rounded-xl font-semibold hover:bg-navy-800 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            href="/fleet"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Cars
          </Link>
        </div>
      </div>
    </div>
  );
}
