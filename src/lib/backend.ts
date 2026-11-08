// Client helpers for the standalone Express backend (BookNook server). Its
// protected routes (the /books write endpoints / borrows) require a Bearer
// token — a short-lived JWT signed via Better Auth. The Better Auth session
// cookie authorizes minting one, so these helpers only work while signed in.

import { decodeTitle, isBotCheckBook, type Book } from "@/lib/books";

// Base URL comes only from the environment (NEXT_PUBLIC_API_URL in
// .env.local locally / the deployed URL in Vercel's project settings) —
// never hardcoded. Trailing slashes are trimmed so `${API_URL}/path`
// never produces a double slash.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/** Base URL of the Express backend, for plain (non-authed) public calls. */
export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}

/** The current session's signed JWT for backend calls, or null when signed out. */
export async function getBackendToken(): Promise<string | null> {
  try {
    // GET /token is served by Better Auth's jwt plugin (needs the session
    // cookie, which same-origin fetches include automatically).
    const res = await fetch("/api/auth/token");

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { token?: string };

    return data.token ?? null;
  } catch {
    return null;
  }
}

/**
 * fetch() wrapper that attaches the Better Auth JWT to the request.
 *
 * ```ts
 * await authedFetch("/books", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify(book),
 * });
 * ```
 */
export async function authedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getBackendToken();

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/** A book document shaped by the backend's /books routes (extra id included). */
export type ApiBook = Book & {
  /** MongoDB _id resolved by the backend — required for edit/delete/borrow. */
  _id?: string;
  addedAt?: string;
};

/** A borrow record shaped by the backend's /borrows routes (mapped camelCase). */
export type ApiBorrow = {
  id: string;
  bookId?: string;
  title: string;
  image?: string;
  borrowedAt: string;
  returnAt: string;
};

type ApiBorrowDoc = {
  _id?: string;
  bookId?: string;
  bookTitle?: string;
  bookImage?: string;
  borrowDate?: string;
  returnDate?: string;
};

/**
 * GET /books (public). Returns every book in the database, newest first,
 * or null when the backend cannot be reached — so callers can fall back
 * to the offline catalog.
 */
export async function fetchAllBooks(): Promise<ApiBook[] | null> {
  try {
    const response = await fetch(apiUrl("/books"));

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ApiBook[];

    if (!Array.isArray(data)) {
      return null;
    }

    // Deployment-checker probe books ("Prodcheck <ms>" by Deploy Bot, etc.)
    // are added by bots on every deployment; they are not library entries
    // and must never surface in any list.
    return data
      .filter((book) => !isBotCheckBook(book))
      .map((book) => ({
      ...book,
      title: decodeTitle(book.title),
      _id: typeof book._id === "string" ? book._id : undefined,
    }));
  } catch {
    return null;
  }
}

/**
 * GET /borrows (JWT). The backend returns raw borrow docs; they are mapped
 * onto the camelCase ApiBorrow shape. Null means the backend is unreachable
 * — callers fall back to their offline borrow storage.
 */
export async function fetchMyBorrows(): Promise<ApiBorrow[] | null> {
  try {
    const response = await authedFetch("/borrows");

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ApiBorrowDoc[];

    if (!Array.isArray(data)) {
      return null;
    }

    return data
      .filter((doc) => doc._id && doc.borrowDate && doc.returnDate)
      .map((doc) => ({
        id: String(doc._id),
        bookId: typeof doc.bookId === "string" ? doc.bookId : undefined,
        title: decodeTitle(String(doc.bookTitle ?? "A borrowed book")),
        image: doc.bookImage,
        borrowedAt: String(doc.borrowDate),
        returnAt: String(doc.returnDate),
      }));
  } catch {
    return null;
  }
}

/**
 * Extracts a human-friendly message from a backend error response so pages
 * can show the server's reason (e.g. duplicate title, not available) directly.
 */
export async function apiErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };

    if (typeof data.message === "string" && data.message) {
      return data.message;
    }
  } catch {
    // Not JSON — use the fallback.
  }

  return fallback;
}
