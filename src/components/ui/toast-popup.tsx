"use client";

import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export type ToastData = {
  type: "success" | "error";
  title: string;
  message?: string;
};

/**
 * A fixed bottom-right toast with an icon, title, message and close button.
 * Render it with the owning page's toast state; it hides itself cleanly
 * when that state is cleared.
 */
export default function ToastPopup({
  toast,
  onClose,
}: {
  toast: ToastData | null;
  onClose: () => void;
}) {
  if (!toast) {
    return null;
  }

  const isError = toast.type === "error";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-5 right-5 z-[70] w-[calc(100%-2.5rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div
        className={`rounded-xl border p-4 shadow-2xl ${
          isError
            ? "border-red-500/30 bg-[#1c1014]"
            : "border-emerald-500/40 bg-[#0f2418]"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              isError
                ? "bg-red-500/15 text-red-400"
                : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            {isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          </span>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-white">{toast.title}</p>

            {toast.message && (
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {toast.message}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={onClose}
            className={`shrink-0 rounded-md p-1 transition ${
              isError
                ? "text-red-300/70 hover:bg-red-500/10 hover:text-red-200"
                : "text-emerald-300/70 hover:bg-emerald-500/10 hover:text-emerald-200"
            }`}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
