"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, ClipboardList, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/dishes", icon: UtensilsCrossed, label: "Dishes" },
  { href: "/profile/orders", icon: ClipboardList, label: "Orders" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    // lg:hidden — on desktop the sidebar nav replaces the bottom bar
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around h-[62px] px-4">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          let isActive = false;
          if (href === "/") {
            isActive = pathname === "/";
          } else if (href === "/profile/orders") {
            isActive = pathname.startsWith("/profile/orders") || pathname.startsWith("/profile/chef-orders");
          } else if (href === "/profile") {
            isActive = pathname === "/profile" || pathname === "/profile/edit" || pathname.startsWith("/profile/dishes");
          } else {
            isActive = pathname === href || pathname.startsWith(href + "/");
          }
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