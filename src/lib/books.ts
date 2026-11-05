// BookNook catalog: 20 books, each from a different type (genre).
// One entry per category, so the /books page shows 20 different types.
// Covers come from the Open Library covers API. The homepage "New Arrivals"
// section shows the latest 6 from MongoDB (with this list as seed/fallback);
// the /books page lists the whole collection plus user-added books
// (merged by src/lib/userBooks.ts).
//
// Every book carries its own details for the /books/[title] page:
// description, the reader who added it, and how many copies are shelved.

export type Book = {
  title: string;
  author: string;
  category: string;
  image: string;
  /** One-line synopsis shown on the details page. */
  description?: string;
  /** Reader who added the book to the shared shelf. */
  addedBy?: { name: string; email: string };
  /** Copies currently left on the shelf (sample catalog only). */
  copies?: number;
};

function openLibraryCover(isbn: string) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

/** Shared fallback cover for covers that fail to load (Open Library 404s). */
export const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80";

/**
 * Book names must never display URL encoding: a title like
 * "The%20Hobbit" (or "Salt%2C%20Fat") is decoded to its real characters.
 * Only runs when the string actually contains %XX sequences, so titles
 * that genuinely contain other text are untouched.
 */
export function decodeTitle(raw: string) {
  if (!/%[0-9A-Fa-f]{2}/.test(raw)) {
    return raw;
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export const sampleBooks: Book[] = [
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    category: "Fantasy",
    image: openLibraryCover("9780345339683"),
    description:
      "Bilbo Baggins leaves his quiet hole for a quest with thirteen dwarves and a dragon at the end.",
    addedBy: { name: "Md Shahriyar Alam", email: "rmdshahriyaram18@gmail.com" },
    copies: 1,
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Fiction",
    image: openLibraryCover("9780061120084"),
    description:
      "Scout Finch watches her father defend an innocent man in a small Alabama town in the 1930s.",
    addedBy: { name: "Sadia Afrin", email: "sadia.afrin91@gmail.com" },
    copies: 3,
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    category: "Science Fiction",
    image: openLibraryCover("9780441172719"),
    description:
      "Paul Atreides is pulled into a war over the desert planet Arrakis and its precious spice.",
    addedBy: { name: "Tanvir Hasan", email: "tanvir.hasan@outlook.com" },
    copies: 2,
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Romance",
    image: openLibraryCover("9780141439518"),
    description:
      "Elizabeth Bennet and Mr. Darcy argue their way into love in this sharp Regency romance.",
    addedBy: { name: "Nusrat Jahan", email: "nusrat.jahan@gmail.com" },
    copies: 4,
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Classics",
    image: openLibraryCover("9780743273565"),
    description:
      "Jay Gatsby throws lavish parties across the bay from Daisy, the woman he cannot forget.",
    addedBy: { name: "Rafid Karim", email: "rafid.karim@gmail.com" },
    copies: 2,
  },
  {
    title: "1984",
    author: "George Orwell",
    category: "Dystopian",
    image: openLibraryCover("9780451524935"),
    description:
      "Winston Smith rebels against a Party that watches every thought and deletes the past.",
    addedBy: { name: "Ayesha Siddiqua", email: "ayesha.s@proton.me" },
    copies: 5,
  },
  {
    title: "And Then There Were None",
    author: "Agatha Christie",
    category: "Mystery",
    image: openLibraryCover("9780062073488"),
    description:
      "Ten strangers are invited to an island where, one by one, they begin to disappear.",
    addedBy: { name: "Imran Hossain", email: "imran.hossain@gmail.com" },
    copies: 1,
  },
  {
    title: "Dracula",
    author: "Bram Stoker",
    category: "Horror",
    image: openLibraryCover("9780486411098"),
    description:
      "A young solicitor's letters trace the journey of a vampire from Transylvania to England.",
    addedBy: { name: "Farhana Akter", email: "farhana.akter@yahoo.com" },
    copies: 3,
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    category: "Science",
    image: openLibraryCover("9780553380163"),
    description:
      "Hawking explains space, time and black holes in plain language for non-scientists.",
    addedBy: { name: "Shakib Rahman", email: "shakib.rahman@gmail.com" },
    copies: 2,
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    category: "History",
    image: openLibraryCover("9780062316097"),
    description:
      "How an ordinary ape came to rule the planet, from foraging bands to the digital age.",
    addedBy: { name: "Mehdi Chowdhury", email: "mehdi.chowdhury@gmail.com" },
    copies: 4,
  },
  {
    title: "The Girl with the Dragon Tattoo",
    author: "Stieg Larsson",
    category: "Thriller",
    image: openLibraryCover("9780307454546"),
    description:
      "A disgraced journalist and a hacker dig into a cold family disappearance in Sweden.",
    addedBy: { name: "Priya Das", email: "priya.das@gmail.com" },
    copies: 1,
  },
  {
    title: "Educated",
    author: "Tara Westover",
    category: "Biography",
    image: openLibraryCover("9780399590504"),
    description:
      "A girl raised by survivalists in the mountains earns a PhD and rewrites her own history.",
    addedBy: { name: "Zara Ali", email: "zara.ali@outlook.com" },
    copies: 2,
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Help",
    image: openLibraryCover("9780735211292"),
    description:
      "Tiny daily changes compound into remarkable results — a practical habit playbook.",
    addedBy: { name: "Nafiul Islam", email: "nafiul.islam@gmail.com" },
    copies: 5,
  },
  {
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    category: "Business",
    image: openLibraryCover("9781612680011"),
    description:
      "Two father figures, two money philosophies, and the lessons that separate them.",
    addedBy: { name: "Arif Mahmud", email: "arif.mahmud@gmail.com" },
    copies: 3,
  },
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    category: "Philosophy",
    image: openLibraryCover("9780812968254"),
    description:
      "The private notes of a Roman emperor on duty, death and staying calm under pressure.",
    addedBy: { name: "Rezwan Ahmed", email: "rezwan.ahmed@proton.me" },
    copies: 1,
  },
  {
    title: "Life of Pi",
    author: "Yann Martel",
    category: "Adventure",
    image: openLibraryCover("9780156027328"),
    description:
      "A boy, a lifeboat and a tiger share 227 days of survival across the Pacific.",
    addedBy: { name: "Lubna Haque", email: "lubna.haque@gmail.com" },
    copies: 2,
  },
  {
    title: "Matilda",
    author: "Roald Dahl",
    category: "Kids",
    image: openLibraryCover("9780142410370"),
    description:
      "A small genius with awful parents finds friends, justice and a little telekinesis.",
    addedBy: { name: "Sumaiya Noor", email: "sumaiya.noor@gmail.com" },
    copies: 4,
  },
  {
    title: "Where the Sidewalk Ends",
    author: "Shel Silverstein",
    category: "Poetry",
    image: openLibraryCover("9780060256739"),
    description:
      "Silly, tender poems and drawings that never talk down to children.",
    addedBy: { name: "Omar Faruk", email: "omar.faruk@yahoo.com" },
    copies: 3,
  },
  {
    title: "Salt, Fat, Acid, Heat",
    author: "Samin Nosrat",
    category: "Cooking",
    image: openLibraryCover("9781476753836"),
    description:
      "The four elements of good cooking, taught with confidence instead of rules.",
    addedBy: { name: "Rifat Kabir", email: "rifat.kabir@gmail.com" },
    copies: 2,
  },
  {
    title: "Into the Wild",
    author: "Jon Krakauer",
    category: "Travel",
    image: openLibraryCover("9780307387073"),
    description:
      "The true story of a young man who walked into the Alaskan wilderness and never returned.",
    addedBy: { name: "Tasnim Islam", email: "tasnim.islam@gmail.com" },
    copies: 1,
  },
];
