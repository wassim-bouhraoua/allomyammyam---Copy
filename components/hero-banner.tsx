"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useTranslation } from "@/context/I18nContext";

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

const SLIDES_DATA: Record<string, BannerSlide[]> = {
  fr: [
    {
      id: "s1",
      tag: "Offre Flash",
      headline: "Les meilleurs plats maison livrés rapidement",
      sub: "20% de réduction sur votre premier repas",
      cta: "Commander",
      gradient: "from-amber-400 via-orange-400 to-orange-500",
      accentBg: "bg-orange-300/25",
      imageUrl: "https://www.tasteofhome.com/wp-content/uploads/2024/11/EXPS_TOHD24_44476_MelissaPatterson_11.jpg?w=700",
    },
    {
      id: "s2",
      tag: "Nouveau Chef",
      headline: "D'authentiques tajines marocains chez vous",
      sub: "Frais depuis les cuisines de nos chefs locaux",
      cta: "Découvrir",
      gradient: "from-orange-500 via-orange-400 to-teal-400",
      accentBg: "bg-orange-300/25",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi4R0Xo2g1bUAP3hISNCHshU-04TxJLqS2GQ&s",
    },
    {
      id: "s3",
      tag: "Offre Week-end",
      headline: "Des fruits de mer premium par nos chefs",
      sub: "Pêche du jour, livraison le jour même",
      cta: "Voir les plats",
      gradient: "from-sky-500 via-blue-500 to-indigo-500",
      accentBg: "bg-sky-300/25",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZkmdNJJLQ6ZvPl_GzsDoN3qBbNLLYeZ1xxw&s",
    },
  ],
  en: [
    {
      id: "s1",
      tag: "Flash Offer",
      headline: "Best homemade dishes delivered fast",
      sub: "20% off your first order today",
      cta: "Order now",
      gradient: "from-amber-400 via-orange-400 to-orange-500",
      accentBg: "bg-orange-300/25",
      imageUrl: "https://www.tasteofhome.com/wp-content/uploads/2024/11/EXPS_TOHD24_44476_MelissaPatterson_11.jpg?w=700",
    },
    {
      id: "s2",
      tag: "New Chef",
      headline: "Authentic Moroccan tagines at home",
      sub: "Fresh from local chef kitchens",
      cta: "Explore",
      gradient: "from-orange-500 via-orange-400 to-teal-400",
      accentBg: "bg-orange-300/25",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi4R0Xo2g1bUAP3hISNCHshU-04TxJLqS2GQ&s",
    },
    {
      id: "s3",
      tag: "Weekend Deal",
      headline: "Premium seafood from coastal chefs",
      sub: "Freshly caught, same-day delivery",
      cta: "See dishes",
      gradient: "from-sky-500 via-blue-500 to-indigo-500",
      accentBg: "bg-sky-300/25",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZkmdNJJLQ6ZvPl_GzsDoN3qBbNLLYeZ1xxw&s",
    },
  ],
  ar: [
    {
      id: "s1",
      tag: "عرض سريع",
      headline: "أفضل الأطباق المنزلية تصلك سريعاً",
      sub: "خصم 20% على طلبك الأول اليوم",
      cta: "اطلب الآن",
      gradient: "from-amber-400 via-orange-400 to-orange-500",
      accentBg: "bg-orange-300/25",
      imageUrl: "https://www.tasteofhome.com/wp-content/uploads/2024/11/EXPS_TOHD24_44476_MelissaPatterson_11.jpg?w=700",
    },
    {
      id: "s2",
      tag: "طاهٍ جديد",
      headline: "طاجين مغربي أصيل في منزلك",
      sub: "طازج من مطابخ طهاتنا المحليين",
      cta: "استكشف",
      gradient: "from-orange-500 via-orange-400 to-teal-400",
      accentBg: "bg-orange-300/25",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi4R0Xo2g1bUAP3hISNCHshU-04TxJLqS2GQ&s",
    },
    {
      id: "s3",
      tag: "عرض نهاية الأسبوع",
      headline: "مأكولات بحرية مميزة من طهاة الساحل",
      sub: "صيد طازج، توصيل في نفس اليوم",
      cta: "عرض الأطباق",
      gradient: "from-sky-500 via-blue-500 to-indigo-500",
      accentBg: "bg-sky-300/25",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZkmdNJJLQ6ZvPl_GzsDoN3qBbNLLYeZ1xxw&s",
    },
  ],
};

const AUTOPLAY_MS = 4000;

export default function HeroBanner() {
  const { locale } = useTranslation();
  const slides = SLIDES_DATA[locale] || SLIDES_DATA.fr;
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number) => {
    setActive((idx + slides.length) % slides.length);
  }, [slides.length]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_MS);
  }, [slides.length]);

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

  const slide = slides[active];
  const arrow = locale === "ar" ? "←" : "→";

  return (
    <div className="px-4 pt-1 pb-3 select-none">
      {/* Slide container */}
      <div
       className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${slide.gradient} transition-all duration-400 ease-out`}
        onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
        onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
        onMouseDown={(e) => onDragStart(e.clientX)}
        onMouseUp={(e) => onDragEnd(e.clientX)}
        onMouseLeave={(e) => { if (dragging) onDragEnd(e.clientX); }}
      >
        {/* Decorative circles */}
        <div className={`absolute -top-10 -right-10 w-44 h-44 rounded-full ${slide.accentBg}`} />
        <div className={`absolute -bottom-8 right-6 w-28 h-28 rounded-full ${slide.accentBg}`} />

        <div className="relative flex items-center justify-between px-5 py-5 lg:px-8 lg:py-6 gap-2 lg:gap-6 min-h-[108px] lg:min-h-[180px]">
          {/* Text block */}
          <div className="flex-1 min-w-0 text-start">
            <span className="inline-block text-[9px] lg:text-[11px] font-black uppercase tracking-[0.12em] text-white/80 bg-white/20 rounded-full px-2.5 py-[3px] lg:px-3.5 lg:py-[5px] mb-2 lg:mb-3">
              {slide.tag}
            </span>
            <h2 className="text-white font-bold text-[15px] lg:text-[24px] leading-[1.25] max-w-[220px] lg:max-w-[480px] mb-1.5 lg:mb-2.5">
              {slide.headline}
            </h2>
            <p className="text-white/75 text-[11px] lg:text-[14px] mb-3 lg:mb-4">{slide.sub}</p>
            <button className="bg-white text-gray-800 text-[11px] lg:text-[13px] font-bold px-4 py-1.5 lg:px-6 lg:py-2.5 rounded-full shadow-sm active:scale-95 transition-transform duration-100">
              {slide.cta} {arrow}
            </button>
          </div>

          {/* Dish image */}
          <div className="relative w-[108px] h-[96px] lg:w-[160px] lg:h-[135px] rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
            <Image
              src={slide.imageUrl}
              alt={slide.headline}
              fill
              sizes="(max-width: 1024px) 108px, 160px"
              priority
              unoptimized
              className="object-cover"
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetTimer(); }}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === active
                ? "w-5 h-2 bg-orange-500"
                : "w-2 h-2 bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
