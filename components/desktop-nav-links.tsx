"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

import { useTranslation } from "@/context/I18nContext";

export default function DesktopNavLinks() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { dict } = useTranslation();

  const links = [
    { label: dict.nav.home, href: "/" },
    { label: dict.nav.dishes, href: "/dishes" },
    { label: dict.nav.cart, href: "/cart", badge: cartCount },
    { label: dict.nav.orders, href: "/profile/orders" },
    { label: dict.nav.profile, href: "/profile" },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ label, href, badge }) => {
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
            className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-[14px] font-semibold transition-all duration-150 ${
              isActive
                ? "bg-secondary text-orange-500 shadow-sm"
                : "text-muted-foreground hover:bg-card hover:text-orange-500 hover:shadow-sm"
            }`}
          >
            <span>{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="bg-orange-500 text-white font-extrabold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 animate-in zoom-in duration-200">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
