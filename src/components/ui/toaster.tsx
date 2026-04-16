// src/components/ui/toaster.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastCallback: ((toast: Toast) => void) | null = null;

export function toast(message: string, type: ToastType = "info") {
  if (toastCallback) {
    toastCallback({ id: Date.now().toString(), type, message });
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 4000);
  }, []);

  useEffect(() => {
    toastCallback = addToast;
    return () => { toastCallback = null; };
  }, [addToast]);

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => {
        const Icon = icons[t.type];
        return (
          <div key={t.id} className={cn("flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-fade-in", styles[t.type])}>
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => setToasts(prev => prev.filter(i => i.id !== t.id))} className="p-0.5 rounded hover:bg-black/10 transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
