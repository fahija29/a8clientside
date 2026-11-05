export type BorrowedBook = {
  title: string;
  author: string;
  category?: string;
  image?: string;
  borrowedAt: string;
  /** Snapshot of the borrower identity at borrow time. */
  borrowerName?: string;
  borrowerEmail?: string;
};

const BORROWS_KEY = "booknook-borrows";

export function getUserBorrows(): BorrowedBook[] {
  try {
    const raw = localStorage.getItem(BORROWS_KEY);
    return raw ? (JSON.parse(raw) as BorrowedBook[]) : [];
  } catch {
    return [];
  }
}

export function borrowBook(book: BorrowedBook) {
  try {
    const list = getUserBorrows();
    if (!list.some((item) => item.title === book.title)) {
      list.unshift(book);
      localStorage.setItem(BORROWS_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore storage failures.
  }
}

export function returnBorrowedBook(borrowedAt: string): BorrowedBook[] {
  try {
    const next = getUserBorrows().filter(
      (item) => item.borrowedAt !== borrowedAt
    );
    localStorage.setItem(BORROWS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}
