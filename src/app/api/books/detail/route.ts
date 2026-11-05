import { NextResponse } from "next/server";

import type { Book } from "@/lib/books";
import { getMongoClient } from "@/lib/mongo";

// GET /api/books/detail?title=... — resolves a single book from the MongoDB
// collection, so any book stored in the database (not just the 20 seeded
// sample titles) can open its own details page.
export async function GET(request: Request) {
  const title = new URL(request.url).searchParams.get("title")?.trim();

  if (!title) {
    return NextResponse.json({ book: null });
  }

  try {
    const client = await getMongoClient();
    const db = client.db();
    const docs = db.collection("books");

    // Case-insensitive, whitespace-tolerant exact-title lookup.
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const doc = await docs.findOne(
      { title: { $regex: `^\\s*${escaped}\\s*$`, $options: "i" } },
      {
        projection: {
          title: 1,
          author: 1,
          category: 1,
          image: 1,
          description: 1,
          addedBy: 1,
          copies: 1,
          // The Borrow flow needs the record's id to create a borrows
          // document and to refresh live copies afterwards.
          _id: 1,
        },
      }
    );

    if (!doc) {
      return NextResponse.json({ book: null });
    }

    const book: Book & { _id?: string } = {
      title: String(doc.title ?? title),
      author: String(doc.author ?? "Unknown author"),
      category: String(doc.category ?? "General"),
      image: String(doc.image ?? ""),
      description: typeof doc.description === "string" ? doc.description : undefined,
      copies: typeof doc.copies === "number" ? doc.copies : undefined,
      addedBy:
        doc.addedBy && typeof doc.addedBy === "object" && "name" in doc.addedBy
          ? {
              name: String((doc.addedBy as { name?: unknown }).name ?? ""),
              email: String((doc.addedBy as { email?: unknown }).email ?? ""),
            }
          : undefined,
    };

    // The id rides along for the borrow flow ("borrow this exact record").
    return NextResponse.json({
      book: doc._id ? { ...book, _id: String(doc._id) } : book,
    });
  } catch {
    // Without MongoDB the client falls back to its local catalog data.
    return NextResponse.json({ book: null });
  }
}
