"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { sampleBooks, decodeTitle, type Book } from "@/lib/books";
import { getUserBooks } from "@/lib/userBooks";
import { fetchAllBooks, type ApiBook } from "@/lib/backend";
import LoadingSection from "@/components/ui/LoadingSpinner";
import PageTitle from "@/components/layout/PageTitle";

/**
 * All Books reads the live MongoDB catalog through the backend's public
 * GET /books (merge of seeded + user-added titles). When the server isn't
 * reachable the built-in catalog plus locally added books keep the page
 * working, same as before.
 */
export default function BooksPage() {
  const [dbBooks, setDbBooks] = useState<ApiBook[] | null>(null);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      // A 0ms timer keeps the localStorage read off the first render
      // (localStorage isn't available during SSR/prerender).
      const localTimer = window.setTimeout(
        () => setUserBooks(getUserBooks()),
        0
      );

      const remote = await fetchAllBooks();

      if (active) {
        setDbBooks(remote);
        setReady(true);
      }

      window.clearTimeout(localTimer);
    }

    loadBooks();

    return () => {
      active = false;
    };
  }, []);

  // The server list wins the dedupe by normalized title — it carries the
  // record ids that edit/delete/borrow need — and local-only books follow.
  const allBooks = useMemo(() => {
    const merged: ApiBook[] = [];

    const seen = new Set<string>();
    const push = (book: Book) => {
      const key = book.title.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        merged.push({ ...book, title: decodeTitle(book.title) });
      }
    };

    (dbBooks ?? []).forEach(push);
    [...userBooks, ...sampleBooks].forEach(push);

    return merged;
  }, [dbBooks, userBooks]);

  const bookCategories = useMemo(
    () => ["All", ...Array.from(new Set(allBooks.map((book) => book.category)))],
    [allBooks]
  );

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allBooks.filter((book) => {
      const matchesCategory = category === "All" || book.category === category;
      const matchesQuery =
        !normalizedQuery ||
        book.title.toLowerCase().includes(normalizedQuery) ||
        book.author.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [allBooks, query, category]);

  if (!ready) {
    return <LoadingSection />;
  }

  return (
    <section className="py-16 sm:py-20">
      <PageTitle title="BookNook | All Books" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            All Books
          </h1>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Browse the full BookNook collection.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 dark:border-white/10 dark:bg-white/5">
          <Search size={17} className="shrink-0 text-slate-400" />

          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or author…"
            className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {bookCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                category === item
                  ? "bg-emerald-600 text-white dark:bg-emerald-200 dark:text-emerald-950"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {filteredBooks.map((book) => (
            <article
              key={book.title}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl dark:border-white/10 dark:bg-[#18251d] dark:hover:border-emerald-500/30"
            >
              <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={book.image}
                  alt={book.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-black/20 dark:font-medium dark:text-slate-400">
                    {book.category}
                  </span>

                  {/* Availability comes straight from the live copies
                      count the backend keeps in sync with borrows. */}
                  {typeof book.copies === "number" && (
                    <span
                      className={`inline-block rounded-md px-2 py-1 text-[11px] font-semibold ${
                        book.copies > 0
                          ? "bg-slate-100 text-slate-600 dark:bg-black/20 dark:text-slate-400"
                          : "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                      }`}
                    >
                      {book.copies > 0
                        ? `${book.copies} ${
                            book.copies === 1 ? "copy" : "copies"
                          }`
                        : "Not available"}
                    </span>
                  )}
                </div>

                <h3 className="mt-2.5 line-clamp-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
                  {book.title}
                </h3>

                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  by {book.author}
                </p>

                <Link
                  href={`/books/${encodeURIComponent(book.title)}`}
                  className="mt-4 flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 dark:bg-emerald-200 dark:text-emerald-950 dark:hover:bg-emerald-100"
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <p className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No books match your search. Try a different title, author, or
            category.
          </p>
        )}
      </div>
    </section>
  );
}
