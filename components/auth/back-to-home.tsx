import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackToHome() {
  return (
    <Link
      href="/"
      className="hidden lg:flex items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150 hover:underline absolute -top-8 left-0 z-10 group"
    >
      <ArrowLeft size={16} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
      Continue Browsing
    </Link>
  );
}
