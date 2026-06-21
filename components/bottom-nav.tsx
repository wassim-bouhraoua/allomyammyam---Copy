"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ClipboardList, User } from "lucide-react";
import { useCart } from "@/context/CartContext";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/cart", icon: ShoppingBag, label: "Cart" },
  { href: "/orders", icon: ClipboardList, label: "Orders" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  return (
    // lg:hidden — on desktop the sidebar nav replaces the bottom bar
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around h-[62px] px-4">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 w-16 group"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 relative ${
                  isActive
                    ? "bg-orange-500 shadow-[0_4px_14px_rgba(255,138,0,0.40)]"
                    : "group-active:bg-secondary"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-white" : "text-muted-foreground"}
                />
                {label === "Cart" && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white font-extrabold text-[8px] min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 animate-in zoom-in duration-200">
                    {cartCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-tight ${
                  isActive ? "text-orange-500" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}