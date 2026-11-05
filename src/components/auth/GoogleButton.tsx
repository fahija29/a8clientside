"use client";

import { useEffect, useState } from "react";

import ToastPopup, { type ToastData } from "@/components/ui/toast-popup";
import { authClient } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Toasts dismiss themselves after a few seconds.
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleClick() {
    if (loading) {
      return;
    }

    setLoading(true);

    // If the user was on their way to a private page (RequireAuth saved it),
    // hand that page to the OAuth flow so Google sends them straight back.
    let callbackURL = "/";

    try {
      const next = sessionStorage.getItem("booknook-next");

      if (next) {
        callbackURL = next;
        sessionStorage.removeItem("booknook-next");
      }
    } catch {
      // No remembered route; the home page it is.
    }

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });

    if (error) {
      // The redirect never happened (e.g. credentials not configured yet).
      setLoading(false);
      setToast({
        type: "error",
        title: "Google sign-in failed",
        message:
          error.message ?? "Could not start Google sign-in. Please try again.",
      });
    }
    // On success the browser navigates away to Google, so no cleanup needed.
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      >
        <GoogleIcon />
        {loading ? "Connecting to Google…" : "Continue with Google"}
      </button>

      <ToastPopup toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
