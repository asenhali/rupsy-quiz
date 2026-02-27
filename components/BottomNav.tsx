"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOnboarding } from "@/context/OnboardingContext";

const ITEMS = [
  { href: "/settings", icon: "/icons/nav-settings.svg", isCenter: false },
  { href: "/placeholder-left", icon: "/icons/nav-placeholder-left.svg", isCenter: false },
  { href: "/", icon: "/icons/nav-home.svg", isCenter: true },
  { href: "/friends", icon: "/icons/nav-friends.svg", isCenter: false },
  { href: "/placeholder-right", icon: "/icons/nav-placeholder-right.svg", isCenter: false },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { isOnboarding } = useOnboarding();

  if (isOnboarding) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#f3e6c0]/80 backdrop-blur-xl border-t border-[#1b2833]/[0.04] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 max-w-[480px] mx-auto px-4">
        {ITEMS.map(({ href, icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              prefetch
              className="flex flex-col items-center justify-center py-2 px-3"
              aria-label={href}
            >
              <div className="flex flex-col items-center justify-center gap-0.5">
                <img
                  src={icon}
                  alt=""
                  className={`w-6 h-6 ${active ? "opacity-90" : "opacity-25"}`}
                  width={24}
                  height={24}
                />
                <div
                  className={`w-1 h-1 rounded-full ${
                    active ? "bg-[#1b2833] opacity-70" : "bg-transparent"
                  }`}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
