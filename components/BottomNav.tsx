"use client";

import { usePathname, useRouter } from "next/navigation";

const ITEMS = [
  { href: "/settings", icon: "/icons/nav-settings.svg", isCenter: false },
  { href: "/placeholder-left", icon: "/icons/nav-placeholder-left.svg", isCenter: false },
  { href: "/", icon: "/icons/nav-home.svg", isCenter: true },
  { href: "/friends", icon: "/icons/nav-friends.svg", isCenter: false },
  { href: "/placeholder-right", icon: "/icons/nav-placeholder-right.svg", isCenter: false },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 shadow-[0_-1px_8px_rgba(0,0,0,0.06)] safe-area-pb">
      <div className="flex items-center justify-around h-14 max-w-[480px] mx-auto px-2">
        {ITEMS.map(({ href, icon, isCenter }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              className={`flex items-center justify-center w-12 h-12 rounded-xl border-0 ${
                active ? "opacity-100" : "opacity-50"
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
