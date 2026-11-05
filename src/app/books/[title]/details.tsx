"use client";

import { LockKeyhole, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import PageTitle from "@/components/layout/PageTitle";
import LoadingSection, { Spinner } from "@/components/ui/LoadingSpinner";
import ToastPopup, { type ToastData } from "@/components/ui/toast-popup";
import { FALLBACK_COVER, sampleBooks, type Book } from "@/lib/books";
import { borrowBook, getUserBorrows, type BorrowedBook } from "@/lib/borrows";
import { getUserBooks } from "@/lib/userBooks";
import {
  apiErrorMessage,
  authedFetch,
  fetchMyBorrows,
  type ApiBorrow,
} from "@/lib/backend";

// Titles are matched on whitespace-normalized lowercase, so links like
// "/books/Salt,%20Fat,%20Acid,%20Heat" and added-book entries all resolve.
function normalizeTitle(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

// The URL param may arrive still URL-encoded (e.g. "The%20Hobbit" or
// "Salt%2C%20Fat"), which used to leak into the rendered book name. Decode
// defensively so no "%" ever shows in a title.
function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Last-resort details, built from the URL title itself. Nothing in
// BookNook ever renders a 404 on a View Details page.
function synthesizeBook(title: string, user?: { name: string; email: string } | null): Book {
  const safeTitle = title.replace(/\s+/g, " ").trim();

  return {
    title: safeTitle || "Untitled book",
    author: "Unknown author",
    category: "General",
    image: FALLBACK_COVER,
    description: `“${safeTitle}” is listed in the BookNook catalog without a full record yet. It sits on 1 copy on the shelf — borrow it for 7 days and return it from My Borrows when you are done reading.`,
    addedBy: user
      ? { name: user.name, email: user.email }
      : { name: "A BookNook reader", email: "unknown@booknook.app" },
    copies: 1,
  };
}

export default function BookDetails({ title }: { title: string }) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [storedBooks, setStoredBooks] = useState<Book[] | null>(null);
  // Offline fallback bookkeeping + state of this session's borrows.
  const [myBorrows, setMyBorrows] = useState<BorrowedBook[] | null>(null);
  const [remoteBook, setRemoteBook] = useState<(Book & { _id?: string }) | null>(
    null
  );
  const [remoteDone, setRemoteDone] = useState(false);
  // "server": borrows live in the borrows collection (available copies are
  // decremented there). "local": the backend is unreachable, so the offline
  // localStorage list is used instead. null: the source is still resolving.
  const [borrowSource, setBorrowSource] = useState<"server" | "local" | null>(
    null
  );
  const [serverBorrows, setServerBorrows] = useState<ApiBorrow[]>([]);
  const [busyBorrow, setBusyBorrow] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Toasts dismiss themselves after a few seconds (same timing as the
  // login/register pages).
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStoredBooks(getUserBooks());
      setMyBorrows(getUserBorrows());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Load the signed-in reader's borrows from the backend. If the server
  // can't be reached the page quietly falls back to its local records.
  useEffect(() => {
    let active = true;

    async function loadBorrows() {
      // The await (including the signed-out branch's resolved promise)
      // keeps every setState below off the synchronous render pass.
      const remote = user
        ? await fetchMyBorrows()
        : await Promise.resolve<ApiBorrow[] | null>(null);

      if (!active) {
        return;
      }

      if (user && remote) {
        setServerBorrows(remote);
        setBorrowSource("server");
      } else if (user) {
        setServerBorrows([]);
        setBorrowSource("local");
      } else {
        setServerBorrows([]);
        setBorrowSource(null);
      }
    }

    void loadBorrows();

    return () => {
      active = false;
    };
  }, [user]);

  const normalizedTitle = normalizeTitle(safeDecode(title));
  const decodedTitle = safeDecode(title);

  const localBook =
    sampleBooks.find(
      (item) => normalizeTitle(item.title) === normalizedTitle
    ) ??
    storedBooks?.find(
      (item) => normalizeTitle(item.title) === normalizedTitle
    );

  // Ask the MongoDB collection for the record (id + live copies count) once.
  // Locally-matched books render immediately and are enriched when this
  // resolves; unknown titles always end in a rendered details page — never
  // a 404.
  useEffect(() => {
    if (storedBooks === null) {
      return;
    }

    let active = true;

    async function findRemoteBook() {
      try {
        const response = await fetch(
          `/api/books/detail?title=${encodeURIComponent(decodedTitle)}`
        );

        if (response.ok) {
          const data = (await response.json()) as {
            book: (Book & { _id?: string }) | null;
          };

          if (active) {
            setRemoteBook(data.book);
          }
        }
      } catch {
        // Ignore network failures; the fallback book still renders.
      }

      if (active) {
        setRemoteDone(true);
      }
    }

    findRemoteBook();

    return () => {
      active = false;
    };
  }, [storedBooks, decodedTitle]);

  // A remote lookup is only pending when there is genuinely something to
  // fetch: no local match and the local storage already read (when the
  // storage read hasn't happened yet, the borrows gate below still holds
  // the page until it finished).
  const remoteLookupPending = !localBook && storedBooks !== null && !remoteDone;

  if (
    remoteLookupPending ||
    myBorrows === null ||
    (user !== null && borrowSource === null)
  ) {
    return <LoadingSection />;
  }

  const baseBook = localBook ?? synthesizeBook(decodedTitle, user);

  // The live server record (when one exists) wins: it carries the MongoDB
  // id needed to borrow and the copies count the backend keeps in sync via
  // $inc. Locally-matched books keep their instant-render title.
  const book: Book & { _id?: string } = {
    ...baseBook,
    ...(remoteBook ?? {}),
    title: baseBook.title,
  };

  // Offline borrows of this title still take copies off the shelf; when the
  // server is reachable, its copies field already reflects every active
  // borrow ($inc -1 on borrow, +1 on return), so nothing is subtracted.
  const activeBorrowCount = myBorrows.filter(
    (item) => normalizeTitle(item.title) === normalizedTitle
  ).length;
  // "Borrowed" is per account: only the signed-in reader's own offline
  // records flip the button (the mirror list can hold other accounts').
  const ownOfflineBorrow = myBorrows.some(
    (item) =>
      normalizeTitle(item.title) === normalizedTitle &&
      item.borrowerEmail?.toLowerCase() === user?.email?.toLowerCase()
  );
  const borrowed =
    borrowSource === "server"
      ? serverBorrows.some(
          (item) => normalizeTitle(item.title) === normalizedTitle
        )
      : ownOfflineBorrow;
  const copiesLeft =
    borrowSource === "server"
      ? Math.max(0, book.copies ?? 1)
      : Math.max(0, (book.copies ?? 1) - activeBorrowCount);

  // Books added by users don't carry donor info; the signed-in reader is
  // the one who shared them.
  const donor =
    book.addedBy ??
    (user
      ? { name: user.name, email: user.email }
      : { name: "A BookNook reader", email: "unknown@booknook.app" });

  // Every detail page gets a description specific to THIS book.
  const description =
    book.description ??
    `“${book.title}” by ${book.author} sits on the ${book.category} shelf, added by ${donor.name}. Borrow it for 7 days and return it from My Borrows when you are done reading.`;

  function rememberNextPath() {
    try {
      sessionStorage.setItem(
        "booknook-next",
        `/books/${encodeURIComponent(book.title)}`
      );
    } catch {
      // Ignore storage failures; user just lands on the home page after login.
    }
  }

  async function confirmBorrow() {
    if (!user || busyBorrow) {
      return;
    }

    setBusyBorrow(true);

    // Server path: a copy is decremented in MongoDB ($inc) and the borrow
    // record is stored in the borrows collection with borrow + return dates
    // (the record's return date is 7 days from now). Double-borrows and
    // emptied shelves are rejected by the backend with 409/400, whose
    // message becomes the toast.
    if (borrowSource === "server" && book._id) {
      try {
        const response = await authedFetch("/borrows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: book._id,
            bookTitle: book.title,
            bookImage: book.image,
            borrowDate: new Date().toISOString(),
            returnDate: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          }),
        });

        if (response.ok) {
          setModalOpen(false);
          setToast({
            type: "success",
            title: "Book borrowed",
            message: `“${book.title}” is yours for 7 days — return it anytime from My Borrows.`,
          });
        } else {
          setModalOpen(false);
          setToast({
            type: "error",
            title: "Borrow not completed",
            message: await apiErrorMessage(
              response,
              "The book could not be borrowed. Please try again."
            ),
          });
        }

        // Re-read the borrows (button state) and the book's live copies —
        // the borrow above removed one from the shelf.
        const freshBorrows = await fetchMyBorrows();

        if (freshBorrows) {
          setServerBorrows(freshBorrows);
        }

        try {
          const liveRes = await fetch(
            `/api/books/detail?title=${encodeURIComponent(book.title)}`
          );

          if (liveRes.ok) {
            const data = (await liveRes.json()) as {
              book: (Book & { _id?: string }) | null;
            };

            if (data.book) {
              setRemoteBook(data.book);
            }
          }
        } catch {
          // Ignore — the button state was already refreshed above.
        }

        setBusyBorrow(false);

        return;
      } catch {
        // The backend is unreachable and the borrow didn't happen — the
        // offline path below records it on this device instead.
      }
    }

    // Offline path: everything lives in localStorage until the backend
    // returns, same as before.
    try {
      borrowBook({
        title: book.title,
        author: book.author,
        category: book.category,
        image: book.image,
        borrowedAt: new Date().toISOString(),
        borrowerName: user?.name,
        borrowerEmail: user?.email,
      });
    } catch {
      // Ignore storage failures; the borrow state still shows for this session.
    }

    setModalOpen(false);
    setMyBorrows(getUserBorrows());
    setToast({
      type: "success",
      title: "Book borrowed",
      message: `“${book.title}” is yours for 7 days (saved on this device — the library server is offline).`,
    });
    setBusyBorrow(false);
  }

  if (!user) {
    return (
      <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
        <PageTitle title={`BookNook | ${book.title}`} />

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#141f17]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
            <LockKeyhole size={24} />
          </div>

          <h1 className="mt-6 font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Please login first
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You need to log in to view the details of{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {book.title}
            </span>
            .
          </p>

          <div className="mt-8 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={rememberNextPath}
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Login
            </Link>

            <Link
              href="/register"
              onClick={rememberNextPath}
              className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Register
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20">
      <PageTitle title={`BookNook | ${book.title}`} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 md:grid-cols-2 lg:gap-16">
          <div>
            <img
              src={book.image}
              alt={book.title}
              onError={(event) => {
                // Broken cover links fall back to a real cover image
                // instead of an empty frame.
                if (event.currentTarget.src !== FALLBACK_COVER) {
                  event.currentTarget.src = FALLBACK_COVER;
                }
              }}
              className="w-full rounded-md object-cover shadow-lg"
            />
          </div>

          <div>
            <span className="inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-black/20 dark:font-medium dark:text-slate-400">
              {book.category}
            </span>

            <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              {book.title}
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              by {book.author}
            </p>

            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-300">
              {description}
            </p>

            <div className="mt-8 grid gap-6 rounded-xl border border-slate-200 bg-slate-50 p-6 sm:grid-cols-2 dark:border-white/10 dark:bg-white/5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Added by
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {donor.name}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {donor.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Copies left
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {copiesLeft}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              {borrowed && copiesLeft > 0 ? (
                <button
                  type="button"
                  disabled
                  className="cursor-default rounded-md bg-emerald-100 px-5 py-2.5 text-sm font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                >
                  Borrowed — yours for 7 days
                </button>
              ) : copiesLeft <= 0 ? (
                <button
                  type="button"
                  disabled
                  aria-label="This book is not available right now"
                  className="cursor-not-allowed rounded-md bg-emerald-800/60 px-5 py-2.5 text-sm font-semibold text-emerald-200/50 line-through dark:bg-emerald-700/40 dark:text-emerald-300/50"
                >
                  Not Available
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="rounded-md bg-emerald-200 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  Borrow This Book
                </button>
              )}

              <Link
                href="/books"
                className="text-sm font-medium text-slate-500 transition hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400"
              >
                Back to all books
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Borrow confirmation modal — identity comes from the login session
          and is read-only here. */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Borrow ${book.title}`}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12241a] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="font-serif text-xl font-bold text-white">
              Borrow “{book.title}”
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              You can keep this book for 7 days.
            </p>

            <div className="mt-6">
              <label
                htmlFor="borrower-name"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                User Name
              </label>

              <input
                id="borrower-name"
                type="text"
                readOnly
                value={user.name}
                aria-readonly="true"
                className="w-full cursor-default rounded-md border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="borrower-email"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                User Email
              </label>

              <input
                id="borrower-email"
                type="email"
                readOnly
                value={user.email}
                aria-readonly="true"
                className="w-full cursor-default rounded-md border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={confirmBorrow}
                disabled={busyBorrow}
                className="flex items-center gap-2 rounded-md bg-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busyBorrow && <Spinner size="h-4 w-4" />}
                {busyBorrow ? "Borrowing…" : "Confirm Borrow"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastPopup toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}
