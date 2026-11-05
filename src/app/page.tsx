
import { Suspense } from "react";
import { BookOpen, RotateCcw, Search, Smile, Sparkles, Atom, Landmark } from "lucide-react";

import Banner, { BannerFallback } from "@/components/layout/Banner";
import LatestBooks from "@/components/home/LatestBooks";
import PageTitle from "@/components/layout/PageTitle";

const categories = [
  {
    name: "Fiction",
    description: "Novels and short stories",
    icon: Sparkles,
  },
  {
    name: "Science",
    description: "How the world works",
    icon: Atom,
  },
  {
    name: "History",
    description: "Stories from the past",
    icon: Landmark,
  },
  {
    name: "Kids",
    description: "Picture books and more",
    icon: Smile,
  },
];

export default function HomePage() {
  return (
    <div>
      <PageTitle title="BookNook | Home" />

      <Suspense fallback={<BannerFallback />}>
        <Banner />
      </Suspense>

      <LatestBooks />

      {/* How Borrowing Works */}
      <section className="bg-slate-100 py-20 sm:py-24 dark:bg-[#11291b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              How Borrowing Works
            </h2>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Three steps. No library card needed.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "Step 1",
                title: "Find a book",
                description:
                  "Browse the shelf and open any book you like.",
                icon: Search,
              },
              {
                step: "Step 2",
                title: "Borrow it",
                description:
                  "Confirm the borrow. The book is yours for 7 days.",
                icon: BookOpen,
              },
              {
                step: "Step 3",
                title: "Return it",
                description:
                  "Done reading? Return it from My Borrows in one click.",
                icon: RotateCcw,
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.step}
                  className="rounded-xl border border-slate-200 bg-white px-8 py-10 text-center dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Icon size={22} />
                  </div>

                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-orange-500 dark:text-orange-300">
                    {step.step}
                  </p>

                  <h3 className="mt-2 font-serif text-2xl font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Categories */}
      <section className="bg-white py-20 sm:py-24 dark:bg-[#0a1d12]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Top Categories
            </h2>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Pick a shelf and start reading.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <div
                  key={category.name}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center dark:border-white/10 dark:bg-white/5"
                >
                  <span className="flex justify-center text-emerald-600 dark:text-emerald-400">
                    <Icon size={26} strokeWidth={1.7} />
                  </span>

                  <h3 className="mt-4 font-serif text-xl font-bold text-slate-900 dark:text-white">
                    {category.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {category.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

