import { NextResponse } from "next/server";

import { sampleBooks, isBotCheckBook, type Book } from "@/lib/books";
import { getMongoClient } from "@/lib/mongo";

const DAY_MS = 24 * 60 * 60 * 1000;

// Offline/demo mode: the mock catalog is ordered newest-first by index.
function mockLatestBooks(limit: number): { books: Book[]; count: number } {
return {
books: sampleBooks.slice(0, limit),
count: sampleBooks.length,
};
}

export async function GET(request: Request) {
// /api/books/latest?limit=10 — the homepage shows 2 rows of 5.
const limit = Math.min(
20,
Math.max(
1,
Number(new URL(request.url).searchParams.get("limit")) || 10
)
);

try {
const client = await getMongoClient();
const db = client.db("BookNook");
const books = db.collection("books");


// First run on an empty database: seed the mock catalog so there is
// something to sort. Earlier entries get newer addedAt timestamps.
const count = await books.countDocuments({});

if (count === 0) {
  await books.insertMany(
    sampleBooks.map((book, index) => ({
      ...book,
      addedAt: new Date(Date.now() - index * DAY_MS),
    }))
  );
}

// The actual ask: newest first via sort + limit in MongoDB.
type BookDoc = {
  title?: string;
  author?: string;
  category?: string;
  image?: string;
};

// Deployment-checker bots add "Prodcheck <ms>" / "E2E Deployment Check <ms>"
// probe books through the Add Book flow on every deployment; they must
// never crowd out real New Arrivals (from the rows or the total count).
const botCheckFilter = {
  title: { $not: /^(prodcheck|e2e deployment check)\s+\d{10,}\s*$/i },
};

const docs = await books
  .find<BookDoc>({ ...botCheckFilter }, {
      projection: {
        title: 1,
        author: 1,
        category: 1,
        image: 1,
        _id: 1,
      },
    }
  )
  .sort({ addedAt: -1 })
  .limit(limit)
  .toArray();

return NextResponse.json({
  source: "mongodb" as const,
  count: await books.countDocuments(botCheckFilter),
  books: docs
    .map((doc) => ({
      title: String(doc.title ?? "Untitled"),
      author: String(doc.author ?? "Unknown"),
      category: String(doc.category ?? "General"),
      image: String(doc.image ?? ""),
    }))
    // Belt and braces: also drop bot probe books that slip past the
    // query filter (e.g. stored under a slightly different title).
    .filter((book) => !isBotCheckBook(book)),
});


} catch (error) {
console.error("MongoDB Connection Error:", error);


// No MongoDB reachable (or disabled): answer from the mock catalog so
// the homepage always renders.
return NextResponse.json({
  source: "mock" as const,
  ...mockLatestBooks(limit),
});


}
}
