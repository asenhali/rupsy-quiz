"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Backpack, Home, Users, Settings } from "lucide-react";
import { useOnboarding } from "@/context/OnboardingContext";
import { useWelcomeModal } from "@/context/WelcomeModalContext";

const ITEMS = [
  { href: "/shop", label: "Obchod", Icon: ShoppingCart },
  { href: "/vybava", label: "Výbava", Icon: Backpack },
  { href: "/", label: "Domov", Icon: Home },
  { href: "/friends", label: "Priatelia", Icon: Users },
  { href: "/settings", label: "Nastavenia", Icon: Settings },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { isOnboarding } = useOnboarding();
  const { showWelcomeModal } = useWelcomeModal();

  if (isOnboarding || showWelcomeModal) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#f3e6c0]/80 backdrop-blur-xl border-t border-[#1b2833]/[0.04] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 max-w-[480px] mx-auto px-4">
        {ITEMS.map(({ href, label, Icon }) => {
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
              aria-label={label}
            >
              <div className="flex flex-col items-center justify-center gap-0.5">
                <Icon
                  className={`w-6 h-6 ${active ? "opacity-90" : "opacity-25"}`}
                  strokeWidth={1.5}
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
