"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { sampleBooks, decodeTitle, type Book } from "@/lib/books";

type LatestResponse = {
  source: "mongodb" | "mock";
  count: number;
  books: Book[];
};

function BookCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
      <div className="aspect-[3/4] animate-pulse bg-slate-200 dark:bg-white/10" />

      <div className="p-4">
        <div className="h-5 w-16 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
        <div className="mt-3 h-5 w-3/4 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
        <div className="mt-4 h-9 w-full animate-pulse rounded-md bg-slate-200 dark:bg-white/10" />
      </div>
    </div>
  );
}

export default function LatestBooks() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [fellBack, setFellBack] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadLatestBooks() {
      try {
        const response = await fetch("/api/books/latest?limit=6");

        if (!response.ok) {
          throw new Error(`Failed to load books (${response.status})`);
        }

        const data = (await response.json()) as LatestResponse;

        if (active) {
          setBooks(
            data.books.map((book) => ({ ...book, title: decodeTitle(book.title) }))
          );
          setFellBack(data.source === "mock");
        }
      } catch {
        // Even without a server the homepage must show books.
        if (active) {
          setBooks(
            sampleBooks
              .slice(0, 6)
              .map((book) => ({ ...book, title: decodeTitle(book.title) }))
          );
          setFellBack(true);
        }
      }
    }

    loadLatestBooks();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-white py-20 sm:py-24 dark:bg-[#0d2318]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            New Arrivals
          </h2>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            The latest books added by our readers.
          </p>
        </div>

        {books === null ? (
          <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {fellBack && (
              <p className="mt-6 text-center text-xs text-slate-500">
                Showing the built-in catalog — start MongoDB (or set
                MONGODB_URI) to read the live collection.
              </p>
            )}

            <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3">
              {books.map((book) => (
                <article
                  key={book.title}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-400/50 hover:shadow-xl dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/40"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-black/30">
                    <img
                      src={book.image}
                      alt={book.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-4">
                    <span className="inline-block rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {book.category}
                    </span>

                    <h3 className="mt-2.5 line-clamp-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
                      {book.title}
                    </h3>

                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      by {book.author}
                    </p>

                    <Link
                      href={`/books/${encodeURIComponent(book.title)}`}
                      className="mt-4 flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            href="/books"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            See All Books
          </Link>
        </div>
      </div>
    </section>
  );
}
