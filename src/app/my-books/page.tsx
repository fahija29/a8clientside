"use client";

import { LibraryBig, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import PageTitle from "@/components/layout/PageTitle";
import LoadingSection, { Spinner } from "@/components/ui/LoadingSpinner";
import ToastPopup, { type ToastData } from "@/components/ui/toast-popup";
import { decodeTitle } from "@/lib/books";
import { getUserBooks, removeUserBook, updateUserBook } from "@/lib/userBooks";
import {
  apiErrorMessage,
  authedFetch,
  fetchAllBooks,
  type ApiBook,
} from "@/lib/backend";
import { uploadCoverToImgbb } from "@/lib/imgbb";

// The five categories the edit form offers, matching Add Book.
const FORM_CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"];

const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB, same ceiling as Add Book.

// One row in My Books: a backend record (with its MongoDB id, editable and
// deletable) or a local-only entry kept for when the backend is offline.
type OwnedBook = ApiBook & { source: "server" | "local" };

/** Books this reader added — backend records first, local-only extras after. */
async function loadMyBooks(userEmail: string): Promise<OwnedBook[]> {
  const remote = await fetchAllBooks();
  const localBooks = getUserBooks();

  const serverOwned = (remote ?? [])
    .filter(
      (book) =>
        book.addedBy &&
        book.addedBy.email.toLowerCase() === userEmail.toLowerCase()
    )
    .map((book): OwnedBook => ({ ...book, source: "server" }));

  const claimed = new Set(
    serverOwned.map((book) => book.title.trim().toLowerCase())
  );

  // Local mirror entries whose server copy hasn't shown up (offline adds)
  // remain listed: they can still be edited/removed on this device.
  // The mirror is shared across accounts on the device, so keep only the
  // entries the signed-in reader added (every mirror record carries its
  // donor's email) — a new account never sees anyone else's local books.
  const localOwned = localBooks
    .filter(
      (book) =>
        book.addedBy?.email?.toLowerCase() === userEmail.toLowerCase() &&
        !claimed.has(book.title.trim().toLowerCase())
    )
    .map((book): OwnedBook => ({ ...book, source: "local" }));

  return [...serverOwned, ...localOwned];
}

export default function MyBooksPage() {
  return (
    <RequireAuth>
      <PageTitle title="BookNook | My Books" />
      <MyBooksContent />
    </RequireAuth>
  );
}

function MyBooksContent() {
  const { user } = useAuth();
  const [books, setBooks] = useState<OwnedBook[] | null>(null);
  const [editingBook, setEditingBook] = useState<OwnedBook | null>(null);
  const [deletingBook, setDeletingBook] = useState<OwnedBook | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Toasts dismiss themselves after a few seconds.
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    // RequireAuth keeps the page from rendering before a session exists.
    if (!user?.email) {
      return;
    }

    let active = true;

    loadMyBooks(user.email).then((loaded) => {
      if (active) {
        setBooks(loaded);
      }
    });

    return () => {
      active = false;
    };
  }, [user?.email]);

  async function reload() {
    if (user?.email) {
      setBooks(await loadMyBooks(user.email));
    }
  }

  if (books === null) {
    return <LoadingSection />;
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            My Books
          </h1>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Books you added to the BookNook library.
          </p>
        </div>

        {books.length === 0 ? (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#141f17]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
              <LibraryBig size={24} />
            </div>

            <h2 className="mt-6 font-serif text-xl font-bold text-slate-900 dark:text-white">
              No books added yet
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Help the library grow by sharing a book you love.
            </p>

            <Link
              href="/add-book"
              className="mt-6 inline-flex rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Add Book
            </Link>
          </div>
        ) : (
          <div className="mt-12 space-y-4">
            {books.map((book) => (
              <div
                key={`${book.source}-${book.title}`}
                className="rounded-xl border border-slate-200 bg-white p-4 sm:flex sm:items-center sm:gap-4 dark:border-white/10 dark:bg-[#18251d]"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <img
                    src={book.image}
                    alt={decodeTitle(book.title)}
                    className="h-20 w-14 shrink-0 rounded-md border border-slate-200 object-cover dark:border-white/10"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-black/20 dark:font-medium dark:text-slate-400">
                        {book.category}
                      </span>

                      {typeof book.copies === "number" && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-black/20 dark:text-slate-400">
                          {book.copies > 0
                            ? `${book.copies} ${
                                book.copies === 1 ? "copy" : "copies"
                              }`
                            : "Not available"}
                        </span>
                      )}

                      {book.source === "local" && (
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                          On this device only
                        </span>
                      )}
                    </div>

                    <h2 className="mt-1.5 line-clamp-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
                      {decodeTitle(book.title)}
                    </h2>

                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      by {book.author}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
                  <Link
                    href={`/books/${encodeURIComponent(decodeTitle(book.title))}`}
                    className="flex flex-1 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:flex-none sm:text-sm"
                  >
                    View Details
                  </Link>

                  <button
                    type="button"
                    onClick={() => setEditingBook(book)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:flex-none sm:text-sm"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingBook(book)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 sm:flex-none sm:text-sm"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingBook && (
        <EditBookModal
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onToast={setToast}
          onSaved={reload}
        />
      )}

      {deletingBook && (
        <DeleteBookModal
          book={deletingBook}
          onClose={() => setDeletingBook(null)}
          onToast={setToast}
          onSaved={reload}
        />
      )}

      <ToastPopup toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}

const modalInputClass =
  "w-full rounded-md border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60";

const modalLabelClass =
  "mb-1.5 block text-sm font-medium text-slate-300";

function EditBookModal({
  book,
  onClose,
  onToast,
  onSaved,
}: {
  book: OwnedBook;
  onClose: () => void;
  onToast: (toast: ToastData) => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [category, setCategory] = useState(
    FORM_CATEGORIES.includes(book.category) ? book.category : "Others"
  );
  const [copies, setCopies] = useState(String(book.copies ?? 1));
  const [description, setDescription] = useState(book.description ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"uploading" | "saving" | null>(null);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setImageFile(null);

      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the cover.");
      setImageFile(null);

      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("The cover image must be smaller than 1 MB.");
      setImageFile(null);

      return;
    }

    setError("");
    setImageFile(file);
  }

  async function handleSave() {
    if (busy) {
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();

    if (!trimmedTitle || !trimmedAuthor) {
      setError("Please enter both the book title and the author.");
      return;
    }

    const copyCount = Number(copies);

    if (!Number.isInteger(copyCount) || copyCount < 1 || copyCount > 20) {
      setError("Total copies must be a whole number between 1 and 20.");
      return;
    }

    setError("");
    setBusy(imageFile ? "uploading" : "saving");

    try {
      // A newly chosen cover goes straight to ImgBB — the record only ever
      // stores the hosted URL, never base64.
      let image = book.image;

      if (imageFile) {
        try {
          image = await uploadCoverToImgbb(imageFile);
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : "Uploading the cover image failed. Please try again."
          );
          setBusy(null);

          return;
        }

        setBusy("saving");
      }

      const patch = {
        title: trimmedTitle,
        author: trimmedAuthor,
        category,
        image,
        description: description.trim(),
        copies: copyCount,
      };

      if (book._id && book.source === "server") {
        // Backend edit: PATCH /books/:id with the Better Auth JWT. The
        // endpoint is scoped to the owner, and title changes reject if
        // another book with that title exists.
        const response = await authedFetch(`/books/${book._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });

        if (!response.ok) {
          setError(
            await apiErrorMessage(
              response,
              "The book could not be updated. Please try again."
            )
          );
          setBusy(null);

          return;
        }
      }

      // Keep the local mirror in sync (the /books list and duplicate
      // checks read it; keys change when the title changes). For local-only
      // records this is the actual edit.
      updateUserBook(book.title, patch);

      onClose();
      await onSaved();
      onToast({
        type: "success",
        title: "Book updated",
        message: `“${decodeTitle(patch.title)}” was updated successfully.`,
      });
    } catch (error) {
      // The Express backend could not be reached — log the raw failure so
      // the console shows the real cause (CORS, refused connection, …).
      console.error("Update book request failed:", error);

      setError(
        "The library server rejected the request. Check that the server is " +
          "running and that you are browsing via http://localhost:3000, then " +
          "try again."
      );
    }

    setBusy(null);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${decodeTitle(book.title)}`}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
      />

      <div className="relative max-h-[calc(100vh-4rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#12241a] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          aria-label="Close"
          onClick={() => !busy && onClose()}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>

        <h2 className="line-clamp-2 pr-6 font-serif text-xl font-bold text-white">
          Edit “{decodeTitle(book.title)}”
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Change the details and save your updates.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="edit-title" className={modalLabelClass}>
              Book Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={modalInputClass}
            />
          </div>

          <div>
            <label htmlFor="edit-author" className={modalLabelClass}>
              Author Name
            </label>
            <input
              id="edit-author"
              type="text"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              className={modalInputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-category" className={modalLabelClass}>
                Category
              </label>
              <select
                id="edit-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={modalInputClass}
              >
                {FORM_CATEGORIES.map((item) => (
                  <option key={item} value={item} className="bg-[#0a1d12]">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-copies" className={modalLabelClass}>
                Total Copies
              </label>
              <input
                id="edit-copies"
                type="number"
                min={1}
                max={20}
                value={copies}
                onChange={(event) => setCopies(event.target.value)}
                className={modalInputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-image" className={modalLabelClass}>
              Book Image{" "}
              <span className="font-normal text-slate-400">
                (optional — replaces the current cover)
              </span>
            </label>
            <input
              id="edit-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={busy !== null}
              className="w-full cursor-pointer rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 outline-none transition file:mr-3 file:rounded-[5px] file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-slate-200 focus:border-emerald-400/60 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-slate-500">
              JPG or PNG up to 1 MB, uploaded to ImgBB.
            </p>
          </div>

          <div>
            <label htmlFor="edit-description" className={modalLabelClass}>
              Short Description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className={`${modalInputClass} resize-none`}
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy !== null}
            className="rounded-md border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={busy !== null}
            className="flex items-center gap-2 rounded-md bg-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy !== null && <Spinner size="h-4 w-4" />}
            {busy === "uploading"
              ? "Uploading Cover…"
              : busy === "saving"
                ? "Saving…"
                : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteBookModal({
  book,
  onClose,
  onToast,
  onSaved,
}: {
  book: OwnedBook;
  onClose: () => void;
  onToast: (toast: ToastData) => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (busy) {
      return;
    }

    setBusy(true);

    if (book._id && book.source === "server") {
      // Backend delete: DELETE /books/:id with the Better Auth JWT, scoped
      // to the owner by the endpoint itself.
      try {
        const response = await authedFetch(`/books/${book._id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          onToast({
            type: "error",
            title: "Delete not completed",
            message: await apiErrorMessage(
              response,
              "The book could not be deleted. Please try again."
            ),
          });
          setBusy(false);

          return;
        }
      } catch (error) {
        console.error("Delete book request failed:", error);

        onToast({
          type: "error",
          title: "Delete not completed",
          message:
            "The library server rejected the request. Check that the server is running and that you are browsing via http://localhost:3000, then try again.",
        });
        setBusy(false);

        return;
      }
    }

    // Drop the local mirror (if any) too so the /books list reflects it.
    removeUserBook(book.title);

    onClose();
    await onSaved();
    onToast({
      type: "success",
      title: "Book deleted",
      message: `“${decodeTitle(book.title)}” was removed from the library${
        book.source === "local" ? " (from this device)" : ""
      }.`,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Delete ${decodeTitle(book.title)}`}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12241a] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          aria-label="Close"
          onClick={() => !busy && onClose()}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <Trash2 size={20} />
        </div>

        <h2 className="mt-4 text-center font-serif text-xl font-bold text-white">
          Delete “{decodeTitle(book.title)}”?
        </h2>

        <p className="mt-2 text-center text-sm text-slate-400">
          This permanently removes the book and its details page. It cannot
          be undone.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-md border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy && <Spinner size="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
