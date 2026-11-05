"use client";

import { Undo2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";

import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import PageTitle from "@/components/layout/PageTitle";
import LoadingSection, { Spinner } from "@/components/ui/LoadingSpinner";
import ToastPopup, { type ToastData } from "@/components/ui/toast-popup";
import { getUserBorrows, returnBorrowedBook } from "@/lib/borrows";
import { decodeTitle } from "@/lib/books";
import { apiErrorMessage, authedFetch, fetchMyBorrows } from "@/lib/backend";

// One rendered borrow row, regardless of where it came from.
type BorrowRow = {
  id: string;
  title: string;
  image?: string;
  borrowDate: string;
  returnDate: string;
  /** "server": a live borrows-collection record; "local": offline record. */
  source: "server" | "local";
};

type BorrowRowInput = {
  id?: string;
  title: string;
  image?: string;
  borrowedAt: string;
  returnAt?: string;
};

function toRows(borrows: BorrowRowInput[], source: "server" | "local") {
  return borrows.map<BorrowRow>((item) => {
    const borrowedAt = item.borrowedAt;
    const borrowedAtDate = new Date(borrowedAt);

    // The backend stamps returnDate on the record itself; offline borrows
    // carry their return date implicitly (+7 days).
    const returnDate =
      item.returnAt ??
      (!Number.isNaN(borrowedAtDate.getTime())
        ? new Date(
            borrowedAtDate.getTime() + 7 * 24 * 60 * 60 * 1000
          ).toISOString()
        : borrowedAt);

    return {
      id: item.id ?? borrowedAt,
      title: decodeTitle(item.title),
      image: item.image,
      borrowDate: borrowedAt,
      returnDate,
      source,
    };
  });
}

export default function MyBorrowsPage() {
  return (
    <RequireAuth>
      <PageTitle title="BookNook | My Borrows" />
      <MyBorrowsContent />
    </RequireAuth>
  );
}

function MyBorrowsContent() {
  const { user } = useAuth();
  const [borrows, setBorrows] = useState<BorrowRow[] | null>(null);
  const [busyReturn, setBusyReturn] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [offline, setOffline] = useState(false);

  // Toasts dismiss themselves after a few seconds.
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let active = true;

    async function loadBorrows() {
      const remote = await fetchMyBorrows();

      if (!active) {
        return;
      }

      if (remote) {
        setBorrows(
          toRows(
            remote.map((borrow) => ({
              id: borrow.id,
              title: borrow.title,
              image: borrow.image,
              borrowedAt: borrow.borrowedAt,
              returnAt: borrow.returnAt,
            })),
            "server"
          )
        );
        setOffline(false);
      } else {
        // Backend unreachable: show this device's borrows — but only the
        // signed-in user's. The shared offline mirror can hold borrows
        // from other accounts on this device; owner identity is stamped
        // on every record, so filter by the current session's email.
        setBorrows(
          toRows(
            getUserBorrows().filter(
              (item) =>
                item.borrowerEmail?.toLowerCase() ===
                user?.email?.toLowerCase()
            ),
            "local"
          )
        );
        setOffline(true);
      }
    }

    loadBorrows();

    return () => {
      active = false;
    };
  }, [user?.email]);

  async function returnBorrow(row: BorrowRow) {
    if (busyReturn) {
      return;
    }

    setBusyReturn(row.id);

    if (row.source === "server") {
      try {
        const response = await authedFetch(`/borrows/${row.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setToast({
            type: "success",
            title: "Book returned",
            message: `“${row.title}” is back on the shelf for other readers.`,
          });
        } else {
          setToast({
            type: "error",
            title: "Return not completed",
            message: await apiErrorMessage(
              response,
              "The book could not be returned. Please try again."
            ),
          });
        }
      } catch (error) {
        console.error("Return borrow request failed:", error);

        setToast({
          type: "error",
          title: "Return not completed",
          message: "Could not reach the library server. Please try again.",
        });

        setBusyReturn(null);

        return;
      }

      // Refresh the table from the server (the returned row disappears).
      const remote = await fetchMyBorrows();

      setBorrows(
        remote
          ? toRows(
              remote.map((borrow) => ({
                id: borrow.id,
                title: borrow.title,
                image: borrow.image,
                borrowedAt: borrow.borrowedAt,
                returnAt: borrow.returnAt,
              })),
              "server"
            )
          : []
      );
      setOffline(false);
      setBusyReturn(null);

      return;
    }

    // Offline path: remove the record on this device.
    const next = returnBorrowedBook(row.borrowDate);
    setBorrows(toRows(next, "local"));
    setBusyReturn(null);
    setToast({
      type: "success",
      title: "Book returned",
      message: `“${row.title}” was returned on this device (the library server is offline).`,
    });
  }

  if (borrows === null) {
    return <LoadingSection />;
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            My Borrows
          </h1>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Books you borrowed. Each one is yours for 7 days.
          </p>
        </div>

        {offline && borrows.length > 0 && (
          <p className="mx-auto mt-6 max-w-md rounded-md bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700 dark:text-amber-300">
            Showing borrows saved on this device — the library server could
            not be reached.
          </p>
        )}

        {borrows.length === 0 ? (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#141f17]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Undo2 size={24} />
            </div>

            <h2 className="mt-6 font-serif text-xl font-bold text-slate-900 dark:text-white">
              Nothing borrowed yet
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Find a book you like and borrow it for a week.
            </p>

            <Link
              href="/books"
              className="mt-6 inline-flex rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Browse Books
            </Link>
          </div>
        ) : (
          <>
            {/* Spec table: Image, Title, Borrow Date, Return Date, Return.
                On mobile the same rows stack vertically. */}
            <div className="mt-12 hidden sm:block">
              <table className="w-full border-separate border-spacing-y-3 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <th className="px-4 pb-1 font-semibold">Book</th>
                    <th className="px-4 pb-1 font-semibold">Borrow Date</th>
                    <th className="px-4 pb-1 font-semibold">Return Date</th>
                    <th className="px-4 pb-1 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {borrows.map((row) => (
                    <TableRow key={row.id} row={row}>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/books/${encodeURIComponent(row.title)}`}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                          View Details
                        </Link>

                        <button
                          type="button"
                          onClick={() => returnBorrow(row)}
                          disabled={busyReturn !== null}
                          className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyReturn === row.id && <Spinner size="h-3.5 w-3.5" />}
                          Return Book
                        </button>
                      </div>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked rows. */}
            <div className="mt-12 space-y-4 sm:hidden">
              {borrows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#18251d]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <img
                      src={row.image}
                      alt={row.title}
                      className="h-20 w-14 shrink-0 rounded-md border border-slate-200 object-cover dark:border-white/10"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
                        {row.title}
                      </h2>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Borrowed {formatDate(row.borrowDate)} · Due{" "}
                        {formatDate(row.returnDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/books/${encodeURIComponent(row.title)}`}
                      className="flex flex-1 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      View Details
                    </Link>

                    <button
                      type="button"
                      onClick={() => returnBorrow(row)}
                      disabled={busyReturn !== null}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyReturn === row.id && <Spinner size="h-3.5 w-3.5" />}
                      Return Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ToastPopup toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}

function formatDate(value: string) {
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

function TableRow({
  row,
  children,
}: {
  row: BorrowRow;
  children: React.ReactNode;
}) {
  return (
    <tr className="rounded-xl bg-white align-middle shadow-sm dark:bg-[#18251d]">
      <td className="rounded-l-xl border-y border-l border-slate-200 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={row.image}
            alt={row.title}
            className="h-20 w-14 shrink-0 rounded-md border border-slate-200 object-cover dark:border-white/10"
          />

          <h2 className="line-clamp-2 min-w-0 max-w-[14rem] font-serif text-base font-bold text-slate-900 dark:text-white lg:max-w-xs">
            {row.title}
          </h2>
        </div>
      </td>

      <td className="border-y border-slate-200 px-4 text-slate-600 dark:border-white/10 dark:text-slate-300">
        {formatDate(row.borrowDate)}
      </td>

      <td className="border-y border-slate-200 px-4 text-slate-600 dark:border-white/10 dark:text-slate-300">
        {formatDate(row.returnDate)}
      </td>

      <td className="rounded-r-xl border-y border-r border-slate-200 px-4 dark:border-white/10">
        {children}
      </td>
    </tr>
  );
}
