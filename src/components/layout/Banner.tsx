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

const slides = [
  {
    eyebrow: "BOOKNOOK",
    title: "Borrow, read, return. Repeat.",
    description:
      "Seven days for every book. Return it with one click when you are done.",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1920&q=80",
  },
  {
    eyebrow: "READ • BORROW • RETURN",
    title: "Borrow a book for a week, then pass it on.",
    description:
      "Pick a title, borrow it for a few days, and return it when you are done reading.",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1920&q=80",
  },
  {
    eyebrow: "SHARE YOUR SHELF",
    title: "Add books and help the library grow.",
    description:
      "Have a book others would love? Add it to BookNook and share it with readers nearby.",
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80",
  },
];

// Static server-renderable shell shown while the streamed Swiper hero hydrates;
// it matches the first slide so there is no visual jump.
export function BannerFallback() {
  return (
    <section className="relative h-[480px] overflow-hidden bg-slate-950 sm:h-[540px]">
      <img
        src={slides[0].image}
        alt="Library shelves full of books"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />

      <div className="relative flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">
            {slides[0].eyebrow}
          </p>

          <h1 className="mt-4 max-w-lg font-serif text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            {slides[0].title}
          </h1>

          <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-50/80">
            {slides[0].description}
          </p>

          <Link
            href="/books"
            className="mt-8 inline-flex items-center rounded-lg bg-emerald-200 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100"
          >
            Browse Books
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Banner() {
  const swiperRef = useRef<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="banner relative h-[480px] overflow-hidden bg-slate-950 sm:h-[540px]">
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
          <SwiperSlide key={slide.eyebrow}>
            <div className="absolute inset-0">
              <img
                src={slide.image}
                alt="Library shelves full of books"
                onError={(event) => {
                  // A dead photo must never leave a slide without a
                  // books background — swap to the first slide's image.
                  if (event.currentTarget.src !== slides[0].image) {
                    event.currentTarget.src = slides[0].image;
                  }
                }}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-slate-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />

            <div
              key={activeIndex === index ? `active-${activeIndex}` : `idle-${index}`}
              className="relative flex h-full items-center animate-in fade-in slide-in-from-bottom-3 duration-700"
            >
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">
                  {slide.eyebrow}
                </p>

                <h1 className="mt-4 max-w-lg font-serif text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
                  {slide.title}
                </h1>

                <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-50/80">
                  {slide.description}
                </p>

                <Link
                  href="/books"
                  className="mt-8 inline-flex items-center rounded-lg bg-emerald-200 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100"
                >
                  Browse Books
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => swiperRef.current?.slidePrev()}
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white/80 transition hover:bg-black/50 hover:text-white"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        aria-label="Next slide"
        onClick={() => swiperRef.current?.slideNext()}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white/80 transition hover:bg-black/50 hover:text-white"
      >
        <ChevronRight size={20} />
      </button>
    </section>
  );
}
