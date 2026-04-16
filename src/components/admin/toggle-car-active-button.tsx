// src/components/admin/toggle-car-active-button.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ToggleCarActiveButtonProps {
  carId: string;
  carName: string;
  isActive: boolean;
}

export function ToggleCarActiveButton({ carId, carName, isActive }: ToggleCarActiveButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optimistic, setOptimistic] = useState(isActive);

  const handleToggle = async () => {
    const next = !optimistic;
    setOptimistic(next);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cars/${carId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) {
        setOptimistic(!next); // revert
      } else {
        router.refresh();
      }
    } catch {
      setOptimistic(!next); // revert
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={optimistic ? `Deactivate ${carName}` : `Activate ${carName}`}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        optimistic ? "bg-green-500" : "bg-gray-200"
      }`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin text-white m-auto" />
      ) : (
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            optimistic ? "translate-x-4" : "translate-x-0"
          }`}
        />
      )}
    </button>
  );
}
