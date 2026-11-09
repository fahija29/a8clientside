"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  EffectFade,
  Navigation,
  Pagination,
} from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";

// ————————————————————————————————————————————————————————————
// Book cover tiles. Real covers come from the Open Library Covers API
// (same free source the details pages use) with ?default=false so a bad
// ISBN 404s immediately. Every tile keeps a styled CSS cover beneath the
// image — if the fetch fails, onError simply hides the photo and the
// colored tile with the title stays visible, so a slide never looks bare.
// ————————————————————————————————————————————————————————————

const COVER_TONES: Record<string, string> = {
  forest:
    "bg-gradient-to-b from-emerald-950 via-emerald-800 to-emerald-950 text-emerald-50",
  whispers: "bg-[#f3eddd] text-slate-700",
  midnight:
    "bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-950 text-indigo-100",
  honorCity:
    "bg-gradient-to-b from-violet-950 via-purple-900 to-fuchsia-950 text-violet-100",
  honor:
    "bg-gradient-to-b from-red-700 via-red-800 to-red-950 text-orange-100",
  greenPath:
    "bg-gradient-to-b from-lime-200 via-green-200 to-emerald-300 text-emerald-900",
  silentStars:
    "bg-gradient-to-b from-slate-800 via-slate-900 to-black text-slate-200",
  oceans:
    "bg-gradient-to-b from-sky-900 via-blue-900 to-slate-900 text-sky-100",
  pride: "bg-[#f2ead8] text-[#8a7355]",
  dracula:
    "bg-gradient-to-b from-[#5f1010] via-[#3d0b0b] to-[#2a0707] text-red-100",
  sapiens: "bg-white text-slate-700",
  y1984: "bg-[#8fb0c9] text-slate-900",
  frankenstein: "bg-[#14181d] text-slate-300",
  moby: "bg-[#edf2f5] text-slate-600",
  gatsby: "bg-[#123527] text-amber-100",
  cosmos:
    "bg-gradient-to-b from-[#0b0f1c] to-[#1a2237] text-slate-200",
  mockingbird: "bg-[#23342b] text-[#ead9c2]",
};

/** Open Library cover URL for an ISBN (large size, 404 on any miss). */
function cover(isbn: string) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
}

const IMAGES = {
  hiddenTrees: cover("9781771642484"), // The Hidden Life of Trees
  nameOfWind: cover("9780756404741"), // The Name of the Wind
  midnightLibrary: cover("9780525559474"), // The Midnight Library
  lotr: cover("9780544003415"), // The Lord of the Rings
  honor: cover("9781594631764"), // The Kite Runner
  sweetgrass: cover("9781571313560"), // Braiding Sweetgrass
  silentPatient: cover("9781250301697"), // The Silent Patient
  oceanLane: cover("9780062255655"), // The Ocean at the End of the Lane
  silentSpring: cover("9780618249060"), // Silent Spring
  pride: cover("9780141439518"), // Pride and Prejudice
  dracula: cover("9780140433814"), // Dracula
  sapiens: cover("9780062316097"), // Sapiens
  y1984: cover("9780451524935"), // 1984
  frankenstein: cover("9780141439471"), // Frankenstein
  moby: cover("9780142437247"), // Moby-Dick
  warOfWorlds: cover("9780451526953"), // The War of the Worlds
  gatsby: cover("9780743273565"), // The Great Gatsby
  cosmos: cover("9780345539434"), // Cosmos
  mockingbird: cover("9780061120084"), // To Kill a Mockingbird
} as const;

function BookCover({
  title,
  sub,
  tone,
  image,
  className = "",
  titleClass = "text-[11px]",
}: {
  title: string;
  sub?: string;
  tone: keyof typeof COVER_TONES;
  image?: string;
  className?: string;
  titleClass?: string;
}) {
  return (
    <div
      className={`relative flex aspect-[2/3] shrink-0 flex-col items-center justify-center overflow-hidden rounded-md border border-black/5 text-center shadow-[0_10px_25px_-10px_rgb(15_23_42/0.35)] transition-all duration-300 ease-out hover:z-20 hover:-translate-y-1.5 hover:shadow-[0_18px_35px_-12px_rgb(15_23_42/0.45)] ${COVER_TONES[tone]} ${className}`}
    >
      <span
        className={`line-clamp-3 font-serif font-bold leading-snug ${titleClass}`}
      >
        {title}
      </span>
      {sub ? (
        <span className="mt-1 text-[6px] uppercase tracking-widest opacity-70">
          {sub}
        </span>
      ) : null}

      {image ? (
        // Fallback tile above stays visible if the cover photo fails.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={title}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 z-10 h-full w-full rounded-lg object-cover"
        />
      ) : null}
    </div>
  );
}

// Slide 1 visual — a quiet study wall: two straight rows of real
// covers, even spacing, no props or tilts.
function CollageFan() {
  return (
    <div className="flex h-full flex-col justify-center gap-6 pl-6 pr-4">
      <div className="flex items-end justify-center gap-5">
        <BookCover
          title="The Hidden Life of Trees"
          tone="forest"
          image={IMAGES.hiddenTrees}
          className="w-24"
          titleClass="text-[10px]"
        />
        <BookCover
          title="The Name of the Wind"
          tone="whispers"
          image={IMAGES.nameOfWind}
          className="w-24"
          titleClass="text-[10px]"
        />
        <BookCover
          title="The Midnight Library"
          tone="midnight"
          image={IMAGES.midnightLibrary}
          className="w-24"
          titleClass="text-[10px]"
        />
      </div>
      <div className="flex items-start justify-center gap-5">
        <BookCover
          title="The Lord of the Rings"
          tone="honorCity"
          image={IMAGES.lotr}
          className="w-20"
          titleClass="text-[10px]"
        />
        <BookCover
          title="The Kite Runner"
          tone="honor"
          image={IMAGES.honor}
          className="w-20"
          titleClass="text-[10px]"
        />
        <BookCover
          title="Braiding Sweetgrass"
          tone="greenPath"
          image={IMAGES.sweetgrass}
          className="w-20"
          titleClass="text-[10px]"
        />
        <BookCover
          title="The Silent Patient"
          tone="silentStars"
          image={IMAGES.silentPatient}
          className="w-20"
          titleClass="text-[10px]"
        />
      </div>
    </div>
  );
}

// Slide 2 visual — two straight even rows of real covers: three large
// favourites up top, a wider spread below. No props, no tilts.
function CollageRows() {
  return (
    <div className="flex h-full flex-col justify-center gap-6 pl-4 pr-2">
      <div className="flex items-end justify-center gap-5">
        <BookCover
          title="The Kite Runner"
          tone="honor"
          image={IMAGES.honor}
          className="w-24"
          titleClass="text-[12px]"
        />
        <BookCover
          title="The Silent Patient"
          tone="silentStars"
          image={IMAGES.silentPatient}
          className="w-24"
          titleClass="text-[12px]"
        />
        <BookCover
          title="Cosmos"
          tone="cosmos"
          image={IMAGES.cosmos}
          className="w-24"
          titleClass="text-[12px]"
        />
      </div>
      <div className="flex items-start justify-center gap-3">
        <BookCover
          title="The Ocean at the End of the Lane"
          tone="oceans"
          image={IMAGES.oceanLane}
          className="w-16"
          titleClass="text-[8px]"
        />
        <BookCover
          title="The Midnight Library"
          tone="honorCity"
          image={IMAGES.midnightLibrary}
          className="w-16"
          titleClass="text-[8px]"
        />
        <BookCover
          title="The Hidden Life of Trees"
          tone="forest"
          image={IMAGES.hiddenTrees}
          className="w-16"
          titleClass="text-[8px]"
        />
        <BookCover
          title="The Name of the Wind"
          tone="whispers"
          image={IMAGES.nameOfWind}
          className="w-16"
          titleClass="text-[8px]"
        />
        <BookCover
          title="Braiding Sweetgrass"
          tone="greenPath"
          image={IMAGES.sweetgrass}
          className="w-16"
          titleClass="text-[8px]"
        />
        <BookCover
          title="Silent Spring"
          tone="greenPath"
          image={IMAGES.silentSpring}
          className="w-16"
          titleClass="text-[8px]"
        />
      </div>
    </div>
  );
}

// Slide 3 visual — a timeless classics wall: one even grid of straight
// covers, uniform gaps, quiet presence. No props, no tilts.
function ClassicsWall() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="grid grid-cols-4 justify-items-center gap-x-4 gap-y-5">
        <BookCover
          title="Pride and Prejudice"
          tone="pride"
          image={IMAGES.pride}
          className="w-20"
          titleClass="text-[10px] italic"
        />
        <BookCover
          title="Dracula"
          tone="dracula"
          image={IMAGES.dracula}
          className="w-20"
          titleClass="text-[12px]"
        />
        <BookCover
          title="Sapiens"
          tone="sapiens"
          image={IMAGES.sapiens}
          className="w-20"
          titleClass="text-[11px] text-orange-600"
        />
        <BookCover
          title="1984"
          tone="y1984"
          image={IMAGES.y1984}
          className="w-20"
          titleClass="text-[13px]"
        />
        <BookCover
          title="Frankenstein"
          tone="frankenstein"
          image={IMAGES.frankenstein}
          className="w-20"
          titleClass="text-[9px]"
        />
        <BookCover
          title="Moby-Dick"
          tone="moby"
          image={IMAGES.moby}
          className="w-20"
          titleClass="text-[11px]"
        />
        <BookCover
          title="The War of the Worlds"
          tone="silentStars"
          image={IMAGES.warOfWorlds}
          className="w-20"
          titleClass="text-[8px]"
        />
        <BookCover
          title="The Great Gatsby"
          tone="gatsby"
          image={IMAGES.gatsby}
          className="w-20"
          titleClass="text-[8px]"
        />
        <BookCover
          title="Cosmos"
          tone="cosmos"
          image={IMAGES.cosmos}
          className="w-20"
          titleClass="text-[12px]"
        />
        <BookCover
          title="To Kill a Mockingbird"
          tone="mockingbird"
          image={IMAGES.mockingbird}
          className="w-20"
          titleClass="text-[9px]"
        />
        <BookCover
          title="Silent Spring"
          tone="greenPath"
          image={IMAGES.silentSpring}
          className="col-span-2 w-20"
          titleClass="text-[9px]"
        />
      </div>
    </div>
  );
}

const slides = [
  {
    key: "borrow-read",
    eyebrow: null,
    title: "Borrow and Read",
    description: "Thousands of titles at your fingertips. Sustainable and convenient.",
    cta: "Browse Books",
    bg: "bg-gradient-to-r from-emerald-100 via-emerald-50 to-white dark:from-[#0e2015] dark:via-[#122419] dark:to-[#0b150f]",
    text: "text-slate-900 dark:text-white",
    sub: "text-slate-600 dark:text-slate-400",
    button:
      "bg-emerald-400 text-emerald-950 hover:bg-emerald-300",
    visual: <CollageFan />,
    visualBg: "bg-white dark:bg-white/5",
    note: "The week's reading",
    meta: "2,400+ titles in the collection",
  },
  {
    key: "discover",
    eyebrow: null,
    title: "Discover Your Next Favorite Book",
    description: "Curated collections and personalized recommendations just for you.",
    cta: "Browse Books",
    bg: "bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50 dark:from-[#122419] dark:via-[#0e2015] dark:to-[#0c1a14]",
    text: "text-slate-900 dark:text-white",
    sub: "text-slate-600 dark:text-slate-400",
    button: "bg-emerald-500 text-white hover:bg-emerald-400",
    visual: <CollageRows />,
    visualBg: "bg-transparent",
    note: "Editor's picks",
    meta: "New arrivals every week",
  },
  {
    key: "classics",
    eyebrow: null,
    title: "Timeless Classics on the Shelf",
    description: "From Austen to Asimov — borrow the books everyone talks about.",
    cta: "Browse Books",
    bg: "bg-gradient-to-br from-teal-50 via-emerald-50 to-lime-50 dark:from-[#0c1a14] dark:via-[#0e2015] dark:to-[#122116]",
    text: "text-slate-900 dark:text-white",
    sub: "text-slate-600 dark:text-slate-400",
    button: "bg-emerald-400 text-emerald-950 hover:bg-emerald-300",
    visual: <ClassicsWall />,
    visualBg: "bg-white/40 dark:bg-white/5",
    note: "The classics shelf",
    meta: "Borrow free for 7 days",
  },
];

// Static server-renderable replica of slide 1, shown while the streamed
// Swiper hero hydrates. Rendering the real cover tiles as plain <img>s in
// the shell means the browser downloads them at HTML parse time — long
// before Swiper mounts — so covers are already on screen (or in cache) the
// moment the slider fades in. (Manually hoisted <link rel="preload"> hints
// are dropped by React 19's dedupe against same-src <img> tags, so the
// shell tiles are the reliable way to front-run the fetch.) The hydrated
// slider renders the identical slide-1 markup, so the swap is seamless and
// every image comes back from cache with no loading gap.
export function BannerFallback() {
  const slide = slides[0];
  return (
    <section className="relative h-[480px] overflow-hidden sm:h-[540px]">
      <div className={`absolute inset-0 ${slide.bg}`}>
        {/* Soft decorative blobs (match the live slide) */}
        <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-emerald-200/50 blur-2xl dark:bg-emerald-900/20" />
        <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-900/20" />

        <div className="relative flex h-full flex-col md:flex-row">
          {/* Text panel */}
          <div className="flex flex-1 items-center">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-md md:pr-8">
                {slide.eyebrow ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                    {slide.eyebrow}
                  </p>
                ) : null}

                <h1
                  className={`mt-3 font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl ${slide.text}`}
                >
                  {slide.title}
                </h1>

                <p className={`mt-5 max-w-sm text-sm leading-6 ${slide.sub}`}>
                  {slide.description}
                </p>

                <Link
                  href="/books"
                  className={`mt-8 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition ${slide.button}`}
                >
                  {slide.cta}
                </Link>

                {slide.meta ? (
                  <p className="mt-5 flex items-center gap-3 text-xs tracking-wide text-slate-500 dark:text-slate-400">
                    <span className="h-px w-6 bg-slate-400/50 dark:bg-white/15" />
                    {slide.meta}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Visual panel — real cover <img>s, downloaded with the HTML */}
          <div
            className={`relative min-h-0 flex-1 overflow-hidden md:mt-6 md:mb-10 ${slide.visualBg}`}
          >
            {slide.visual}

            {slide.note ? (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 px-4">
                <span className="h-px w-10 bg-slate-400/40" />
                <span className="whitespace-nowrap font-serif text-xs italic text-slate-500 dark:text-slate-400">
                  {slide.note}
                </span>
                <span className="h-px w-10 bg-slate-400/40 dark:bg-white/15" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Banner() {
  const swiperRef = useRef<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="banner relative h-[480px] overflow-hidden sm:h-[540px]">
      <Swiper
        modules={[Autoplay, EffectFade, Navigation, Pagination]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={800}
        loop
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="h-full w-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.key}>
            <div className={`absolute inset-0 ${slide.bg}`}>
              {/* Soft decorative blobs (slide 2 vibe) */}
              <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-emerald-200/50 blur-2xl dark:bg-emerald-900/20" />
              <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-900/20" />

              <div className="relative flex h-full flex-col md:flex-row">
                {/* Text panel */}
                <div className="flex flex-1 items-center">
                  <div
                    key={
                      activeIndex === index
                        ? `active-${activeIndex}`
                        : `idle-${index}`
                    }
                    className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
                  >
                    <div className="max-w-md animate-in fade-in slide-in-from-bottom-3 duration-700 md:pr-8">
                      {slide.eyebrow ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                          {slide.eyebrow}
                        </p>
                      ) : null}

                      <h1
                        className={`mt-3 font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl ${slide.text}`}
                      >
                        {slide.title}
                      </h1>

                      <p
                        className={`mt-5 max-w-sm text-sm leading-6 ${slide.sub}`}
                      >
                        {slide.description}
                      </p>

                      <Link
                        href="/books"
                        className={`mt-8 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition ${slide.button}`}
                      >
                        {slide.cta}
                      </Link>

                      {slide.meta ? (
                        <p className="mt-5 flex items-center gap-3 text-xs tracking-wide text-slate-500 dark:text-slate-400">
                          <span className="h-px w-6 bg-slate-400/50 dark:bg-white/15" />
                          {slide.meta}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Visual panel */}
                <div
                  className={`relative min-h-0 flex-1 overflow-hidden md:mt-6 md:mb-10 ${slide.visualBg}`}
                >
                  {slide.visual}

                  {/* Quiet editorial caption beneath the collage */}
                  {slide.note ? (
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 px-4">
                      <span className="h-px w-10 bg-slate-400/40" />
                      <span className="whitespace-nowrap font-serif text-xs italic text-slate-500 dark:text-slate-400">
                        {slide.note}
                      </span>
                      <span className="h-px w-10 bg-slate-400/40 dark:bg-white/15" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => swiperRef.current?.slidePrev()}
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-emerald-900 shadow-md transition hover:bg-white dark:bg-white/10 dark:text-emerald-200 dark:hover:bg-white/20"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        aria-label="Next slide"
        onClick={() => swiperRef.current?.slideNext()}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-emerald-900 shadow-md transition hover:bg-white dark:bg-white/10 dark:text-emerald-200 dark:hover:bg-white/20"
      >
        <ChevronRight size={20} />
      </button>
    </section>
  );
}
