"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, Lock, LogIn, UserPlus } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import PageTitle from "@/components/layout/PageTitle";

export default function PleaseLoginPage() {
  return (
    <>
      <PageTitle title="BookNook | Login Required" />
      <PleaseLoginCard />
    </>
  );
}

function PleaseLoginCard() {
  const router = useRouter();
  const { user, ready } = useAuth();

  // The server proxy (src/proxy.ts) bounces signed-out visitors here as
  // /please-login?next=… when they open a book details page. Remember the
  // destination the same way the login page does, so BOTH paths offered
  // below return the reader to the book they wanted — and each button also
  // re-attaches ?next= at click time, so the intent survives even if
  // sessionStorage is unavailable or cleared along the way. Only same-app
  // paths are accepted (no open redirects via "//" protocol-relative URLs).
  useEffect(() => {
    try {
      const next = new URLSearchParams(window.location.search).get("next");

      if (next?.startsWith("/") && !next.startsWith("//")) {
        sessionStorage.setItem("booknook-next", next);
      }
    } catch {
      // Storage unavailable — the buttons still carry ?next= in the URL.
    }
  }, []);

  // A validated same-app destination from ?next=…, or "" when absent.
  function nextFromUrl() {
    try {
      const next = new URLSearchParams(window.location.search).get("next");

      return next?.startsWith("/") && !next.startsWith("//") ? next : "";
    } catch {
      return "";
    }
  }

  // Navigate to an auth page, appending ?next=… when a destination exists.
  function goAuth(event: React.MouseEvent, base: string) {
    const next = nextFromUrl();

    if (next) {
      event.preventDefault();
      router.push(`${base}?next=${encodeURIComponent(next)}`);
    }
  }

  // Already signed in (stale link) — continue straight to the destination.
  // Full page load rather than router.replace: the client router cache may
  // hold a stale "redirect to please-login" entry for the destination URL
  // from before the visitor signed in; a fresh document load re-runs the
  // server gate with the session cookie and lands on the page directly.
  useEffect(() => {
    if (!ready || !user) {
      return;
    }

    try {
      const next = new URLSearchParams(window.location.search).get("next");

      window.location.replace(
        next?.startsWith("/") && !next.startsWith("//") ? next : "/"
      );
    } catch {
      window.location.replace("/");
    }
  }, [ready, user]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-10 dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
          <Lock size={26} />
        </div>

        <h1 className="mt-5 font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Please login first
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Book details are for BookNook members. Login to your account — or
          create a free one — to view this book and borrow it.
        </p>

        <div className="mt-7 grid gap-3">
          <Link
            href="/login"
            onClick={(event) => goAuth(event, "/login")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <LogIn size={16} />
            Login
          </Link>

          <Link
            href="/register"
            onClick={(event) => goAuth(event, "/register")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
          >
            <UserPlus size={16} />
            Register
          </Link>
        </div>

        <Link
          href="/books"
          className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
        >
          <BookOpen size={14} />
          Continue browsing all books
        </Link>
      </div>
    </main>
  );
}
