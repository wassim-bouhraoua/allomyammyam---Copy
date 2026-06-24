"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

import { useTranslation } from "@/context/I18nContext";

interface HomeSectionProps {
  title: string;
  subtitle?: string;
  href?: string;
  children: ReactNode;
  scrollable?: boolean;
}

export default function HomeSection({
  title,
  subtitle,
  href = "/dishes",
  children,
  scrollable = true,
}: HomeSectionProps) {
  const { dict } = useTranslation();

  return (
    <section className="mb-7">
      <div className="flex items-start justify-between px-4 mb-3">
        <div>
          <h2 className="text-[15px] font-bold text-foreground leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-orange-500 mt-0.5 active:opacity-70"
          >
            {dict.dishDetail.related.seeAll} <ChevronRight size={12} strokeWidth={2.5} className="rtl:rotate-180" />
          </Link>
        )}
      </div>

      {scrollable ? (
        <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3">{children}</div>
      )}
    </section>
  );
}