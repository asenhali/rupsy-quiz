"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/settings", icon: "/icons/nav-settings.svg", isCenter: false },
  { href: "/placeholder-left", icon: "/icons/nav-placeholder-left.svg", isCenter: false },
  { href: "/", icon: "/icons/nav-home.svg", isCenter: true },
  { href: "/friends", icon: "/icons/nav-friends.svg", isCenter: false },
  { href: "/placeholder-right", icon: "/icons/nav-placeholder-right.svg", isCenter: false },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-[#1b2833]/[0.06] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-[480px] mx-auto px-2">
        {ITEMS.map(({ href, icon, isCenter }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={`flex items-center justify-center w-12 h-12 rounded-xl border-0 ${
                active ? "opacity-100" : "opacity-30"
              } ${isCenter ? "w-14 h-14" : ""}`}
              aria-label={href}
            >
              <img
                src={icon}
                alt=""
                className={isCenter ? "w-7 h-7" : "w-6 h-6"}
                width={isCenter ? 28 : 24}
                height={isCenter ? 28 : 24}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
