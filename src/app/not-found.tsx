import Link from "next/link";
import { Search, Home, Car } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-8xl font-bold text-gray-200 mb-2 select-none">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to homepage
          </Link>
          <Link
            href="/fleet"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Car className="h-4 w-4" />
            Browse fleet
          </Link>
        </div>
      </div>
    </div>
  );
}
