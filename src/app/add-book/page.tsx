"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { FALLBACK_COVER, sampleBooks, type Book } from "@/lib/books";
import { addUserBook, getUserBooks } from "@/lib/userBooks";
import { authedFetch } from "@/lib/backend";
import { uploadCoverToImgbb } from "@/lib/imgbb";
import { Spinner } from "@/components/ui/LoadingSpinner";
import ToastPopup, { type ToastData } from "@/components/ui/toast-popup";
import PageTitle from "@/components/layout/PageTitle";

const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB — keeps covers quick to upload.

// The five categories the form accepts. "Others" covers anything outside
// the listed genres.
const FORM_CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"];

function sameTitle(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export default function AddBookPage() {
  return (
    <RequireAuth>
      <PageTitle title="BookNook | Add Book" />
      <AddBookForm />
    </RequireAuth>
  );
}

function AddBookForm() {
  const { user } = useAuth();

  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-100";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Fiction");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [copies, setCopies] = useState("1");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"uploading" | "saving" | null>(null);
  const [addedTitle, setAddedTitle] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Toasts dismiss themselves after a few seconds.
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validate required fields and total copies before anything is uploaded.
    if (!user) {
      setError("Please log in first.");
      return;
    }

    if (!title.trim() || !author.trim()) {
      setError("Please enter both the book title and the author.");
      return;
    }

    const copyCount = Number(copies);

    if (!Number.isInteger(copyCount) || copyCount < 1 || copyCount > 20) {
      setError("Total copies must be a whole number between 1 and 20.");
      return;
    }

    const localExists =
      sampleBooks.some((item) => sameTitle(item.title, title)) ||
      getUserBooks().some((item) => sameTitle(item.title, title));

    if (localExists) {
      setError("This book is already in the library.");
      return;
    }

    setAddedTitle(null);
    setError("");
    setBusy("uploading");

    try {
      // Best-effort duplicate check against MongoDB via the existing
      // detail lookup. A failed lookup never blocks the submission.
      try {
        const checkRes = await fetch(
          `/api/books/detail?title=${encodeURIComponent(title.trim())}`
        );

        if (checkRes.ok) {
          const { book } = (await checkRes.json()) as { book: Book | null };

          if (book) {
            setError("This book is already in the library.");
            setBusy(null);
            return;
          }
        }
      } catch {
        // Offline / unreachable server: the backend still guards duplicates.
      }

      // Hosted URL, never base64: a chosen file goes to ImgBB and the book
      // record only stores the link.
      let image = FALLBACK_COVER;

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
      }

      setBusy("saving");

      // The backend requires a non-empty description; when the reader
      // leaves it blank, a friendly default is stored instead.
      const savedDescription =
        description.trim() ||
        `A reader-added ${category.toLowerCase()} title shared with the BookNook community.`;

      // The book is saved through the Express backend, authenticated with
      // the Better Auth JWT. The signed-in reader is stored as the donor.
      const response = await authedFetch("/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          category,
          image,
          description: savedDescription,
          copies: copyCount,
          addedBy: { name: user.name, email: user.email },
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError(
            "Your session expired and the book could not be saved. Please log in again."
          );
        } else if (response.status === 409) {
          setError("This book is already in the library.");
        } else {
          setError(
            "The book could not be saved. Please try again in a moment."
          );
        }

        setBusy(null);
        return;
      }

      // Mirror the new book locally so the /books list and duplicate
      // checks see it immediately (the backend copy now lives in MongoDB).
      addUserBook({
        title: title.trim(),
        author: author.trim(),
        category,
        image,
        description: savedDescription,
        copies: copyCount,
        addedBy: { name: user.name, email: user.email },
      });

      setAddedTitle(title.trim());
      setToast({
        type: "success",
        title: "Book added",
        message: `“${title.trim()}” was added to the library.`,
      });
      setTitle("");
      setAuthor("");
      setCategory("Fiction");
      setImageFile(null);
      setDescription("");
      setCopies("1");

      // Clear the native file input so its label reflects the reset state.
      const fileInput = document.getElementById(
        "book-image"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      // The Express backend could not be reached (or the token call failed).
      // Log the raw error so the dev console shows the real cause (CORS
      // mismatch, connection refused, token endpoint failure…), and surface
      // a message that covers the candidates instead of blaming a running
      // server that is actually fine.
      console.error("Add book request failed:", error);

      setError(
        "The library server rejected the request. Please try again in a " +
          "moment — if it keeps failing, the server may be unreachable."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-slate-100 py-14 text-center sm:py-16 dark:bg-[#11291b]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Add a Book
          </h1>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Put a book from your shelf into the library.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="bg-white py-16 dark:bg-[#0a1d12]">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="book-title" className={labelClass}>
                  Book Title
                </label>
                <input
                  id="book-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. The Midnight Library"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="book-author" className={labelClass}>
                  Author Name
                </label>
                <input
                  id="book-author"
                  type="text"
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  placeholder="e.g. Matt Haig"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="book-category" className={labelClass}>
                  Category
                </label>
                <select
                  id="book-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={inputClass}
                >
                  {FORM_CATEGORIES.map((item) => (
                    <option key={item} value={item} className="bg-white dark:bg-[#0a1d12]">
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="book-copies" className={labelClass}>
                  Total Copies
                </label>
                <input
                  id="book-copies"
                  type="number"
                  min={1}
                  max={20}
                  value={copies}
                  onChange={(event) => setCopies(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="book-image" className={labelClass}>
                Book Image
              </label>
              <input
                id="book-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={busy !== null}
                className="w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none transition file:mr-3 file:rounded-[5px] file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:text-slate-700 hover:border-slate-400 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/20 dark:file:bg-white/10 dark:file:text-slate-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                JPG or PNG up to 1 MB. No file chosen and we will use a
                library cover instead.
              </p>
            </div>

            <div>
              <label htmlFor="book-description" className={labelClass}>
                Short Description
              </label>
              <textarea
                id="book-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="A short line about the book shown on its details page…"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="book-user-name" className={labelClass}>
                  User Name
                </label>
                <input
                  id="book-user-name"
                  type="text"
                  readOnly
                  value={user?.name ?? ""}
                  className={`${inputClass} cursor-default opacity-80`}
                />
              </div>

              <div>
                <label htmlFor="book-user-email" className={labelClass}>
                  User Email
                </label>
                <input
                  id="book-user-email"
                  type="email"
                  readOnly
                  value={user?.email ?? ""}
                  className={`${inputClass} cursor-default opacity-80`}
                />
              </div>
            </div>

            {busy === "uploading" && (
              <p
                className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
                role="status"
              >
                <Spinner size="h-4 w-4" />
                Uploading cover image…
              </p>
            )}

            {busy === "saving" && (
              <p
                className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
                role="status"
              >
                <Spinner size="h-4 w-4" />
                Saving the book to the library…
              </p>
            )}

            {error && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            {addedTitle && (
              <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                “{addedTitle}” was added to the library —{" "}
                <Link
                  href={`/books/${encodeURIComponent(addedTitle)}`}
                  className="font-semibold underline"
                >
                  view its details
                </Link>
                .
              </p>
            )}

            <button
              type="submit"
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-200 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              {busy !== null && <Spinner size="h-4 w-4" />}
              {busy === "uploading"
                ? "Uploading Cover…"
                : busy === "saving"
                  ? "Saving…"
                  : "Add Book"}
            </button>
          </form>
        </div>
      </section>

      <ToastPopup toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
