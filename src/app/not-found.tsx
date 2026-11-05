import Link from "next/link";
import { BookX, Home } from "lucide-react";

import PageTitle from "@/components/layout/PageTitle";

export default function NotFound() {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <PageTitle title="BookNook | Page Not Found" />

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#15291d] px-8 py-12 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
          <BookX size={28} />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">
          404
        </p>

        <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-white">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          The page you are looking for has slipped off the shelf or never
          existed. Let&apos;s get you back to the reading room.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            <Home size={16} />
            Back to Home
          </Link>

          <Link
            href="/books"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10"
          >
            Browse Books
          </Link>
        </div>
      </div>
    </section>
  );
}
