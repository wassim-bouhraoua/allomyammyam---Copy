"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

interface BannerSlide {
  id: string;
  tag: string;
  headline: string;
  sub: string;
  cta: string;
  gradient: string;
  accentBg: string;
  imageUrl: string;
}

const SLIDES: BannerSlide[] = [
  {
    id: "s1",
    tag: "Flash Offer",
    headline: "Best homemade dishes delivered fast",
    sub: "20% off your first order today",
    cta: "Order now",
    gradient: "from-amber-400 via-orange-400 to-orange-500",
    accentBg: "bg-orange-300/25",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80",
  },
  {
    id: "s2",
    tag: "New Chef",
    headline: "Authentic Moroccan tagines at home",
    sub: "Fresh from local chef kitchens",
    cta: "Explore",
    gradient: "from-emerald-500 via-emerald-400 to-teal-400",
    accentBg: "bg-emerald-300/25",
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=80",
  },
  {
    id: "s3",
    tag: "Weekend Deal",
    headline: "Premium seafood from coastal chefs",
    sub: "Freshly caught, same-day delivery",
    cta: "See dishes",
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
    accentBg: "bg-sky-300/25",
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&q=80",
  },
];

const AUTOPLAY_MS = 4000;

export default function HeroBanner() {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number) => {
    setActive((idx + SLIDES.length) % SLIDES.length);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  // Touch / mouse swipe
  const onDragStart = (clientX: number) => {
    dragStartX.current = clientX;
    setDragging(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const onDragEnd = (clientX: number) => {
    if (!dragging) return;
    const diff = dragStartX.current - clientX;
    if (Math.abs(diff) > 40) goTo(active + (diff > 0 ? 1 : -1));
    setDragging(false);
    resetTimer();
  };

  const slide = SLIDES[active];

  return (
    <div className="px-4 pt-1 pb-3 select-none">
      {/* Slide container */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${slide.gradient} transition-[background] duration-500`}
        onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
        onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
        onMouseDown={(e) => onDragStart(e.clientX)}
        onMouseUp={(e) => onDragEnd(e.clientX)}
        onMouseLeave={(e) => { if (dragging) onDragEnd(e.clientX); }}
      >
        {/* Decorative circles */}
        <div className={`absolute -top-10 -right-10 w-44 h-44 rounded-full ${slide.accentBg}`} />
        <div className={`absolute -bottom-8 right-6 w-28 h-28 rounded-full ${slide.accentBg}`} />

        <div className="relative flex items-center justify-between px-5 py-5 gap-2 min-h-[108px]">
          {/* Text block */}
          <div className="flex-1 min-w-0">
            <span className="inline-block text-[9px] font-black uppercase tracking-[0.12em] text-white/80 bg-white/20 rounded-full px-2.5 py-[3px] mb-2">
              {slide.tag}
            </span>
            <h2 className="text-white font-bold text-[15px] leading-[1.25] max-w-[155px] mb-1.5">
              {slide.headline}
            </h2>
            <p className="text-white/75 text-[11px] mb-3">{slide.sub}</p>
            <button className="bg-white text-gray-800 text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform duration-100">
              {slide.cta} →
            </button>
          </div>

          {/* Dish image */}
          <div className="relative w-[108px] h-[96px] rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
            <Image
              key={slide.id}
              src={slide.imageUrl}
              alt={slide.headline}
              fill
              sizes="108px"
              className="object-cover"
              draggable={false}
              priority
            />
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetTimer(); }}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === active
                ? "w-5 h-2 bg-emerald-500"
                : "w-2 h-2 bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
