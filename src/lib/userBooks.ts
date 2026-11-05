import type { Book } from "@/lib/books";

const USER_BOOKS_KEY = "booknook-user-books";

export function getUserBooks(): Book[] {
  try {
    const raw = localStorage.getItem(USER_BOOKS_KEY);
    return raw ? (JSON.parse(raw) as Book[]) : [];
  } catch {
    return [];
  }
}

export function addUserBook(book: Book) {
  try {
    const list = getUserBooks();
    list.unshift(book);
    localStorage.setItem(USER_BOOKS_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage failures; the book still shows for this session.
  }
}

export function removeUserBook(title: string): Book[] {
  try {
    const next = getUserBooks().filter(
      (book) => book.title.toLowerCase() !== title.toLowerCase()
    );
    localStorage.setItem(USER_BOOKS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

/**
 * Patched a locally-mirrored book in place (My Books edit while the backend
 * is offline — the server copy stays the source of truth when reachable).
 */
export function updateUserBook(
  title: string,
  patch: Partial<Book>
): Book[] {
  try {
    const next = getUserBooks().map((book) =>
      book.title.toLowerCase() === title.toLowerCase()
        ? { ...book, ...patch, addedBy: book.addedBy ?? patch.addedBy }
        : book
    );
    localStorage.setItem(USER_BOOKS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return getUserBooks();
  }
}
