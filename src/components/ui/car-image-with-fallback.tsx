// src/components/ui/car-image-with-fallback.tsx
// Client component: renders a car image with graceful fallback when the file
// is missing (404) or the URL is null. Handles legacy placeholder SVG URLs too.
"use client";

import { useState } from "react";
import { Car } from "lucide-react";

interface CarImageWithFallbackProps {
  url: string | null | undefined;
  alt: string;
  /** CSS classes applied to the <img> element */
  imgClassName?: string;
  /** CSS classes applied to the fallback container */
  fallbackClassName?: string;
  /** Lucide icon size class, e.g. "h-8 w-8" */
  iconSize?: string;
}

export function CarImageWithFallback({
  url,
  alt,
  imgClassName = "w-full h-full object-cover",
  fallbackClassName = "flex items-center justify-center h-full w-full bg-gray-100",
  iconSize = "h-6 w-6",
}: CarImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className={fallbackClassName}>
        <Car className={`${iconSize} text-gray-300`} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={imgClassName}
      onError={() => setError(true)}
    />
  );
}
