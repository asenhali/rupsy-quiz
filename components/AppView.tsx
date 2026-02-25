"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, PanInfo } from "framer-motion";
import { SwipeProvider, useSwipeContext } from "@/context/SwipeContext";

export interface PanelDef {
  route: string;
  label: string;
  component: React.ReactNode;
}

interface AppViewProps {
  panels: PanelDef[];
  showDots?: boolean;
}

const SWIPE_THRESHOLD = 30;
const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 0.8 };

function getViewportWidth() {
  if (typeof window === "undefined") return 480;
  return Math.min(window.innerWidth, 480);
}

function AppViewInner({ panels, showDots = false }: AppViewProps) {
  const pathname = usePathname();
  const { swipeDisabled } = useSwipeContext();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const panelCount = panels.length;

  const activeIndex = useMemo(() => {
    const idx = panels.findIndex((p) => p.route === pathname);
    return idx === -1 ? 0 : idx;
  }, [pathname, panels]);

  const x = useMotionValue(-activeIndex * getViewportWidth());
  const springX = useSpring(x, SPRING_CONFIG);

  useEffect(() => {
    x.set(-activeIndex * getViewportWidth());
  }, [activeIndex, x]);

  useEffect(() => {
    const handleResize = () => {
      x.set(-activeIndex * getViewportWidth());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex, x]);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, panelCount - 1));
      router.push(panels[clamped].route);
    },
    [panels, panelCount, router]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      const swipe = offset.x + velocity.x * 0.3;

      if (swipe < -SWIPE_THRESHOLD && activeIndex < panelCount - 1) {
        goTo(activeIndex + 1);
      } else if (swipe > SWIPE_THRESHOLD && activeIndex > 0) {
        goTo(activeIndex - 1);
      } else {
        x.set(-activeIndex * getViewportWidth());
      }
    },
    [activeIndex, panelCount, goTo, x]
  );

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-[480px] h-full overflow-hidden bg-[#f3e6c0]"
    >
      <motion.div
        className="flex h-full will-change-transform"
        style={{
          width: `${panelCount * 100}%`,
          x: springX,
        }}
        drag={swipeDisabled ? false : "x"}
        dragConstraints={containerRef}
        dragElastic={0.15}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        dragMomentum={false}
      >
        {panels.map((panel) => (
          <section
            key={panel.route}
            className="h-full overflow-y-auto flex-shrink-0"
            style={{ width: `${100 / panelCount}%` }}
          >
            {panel.component}
          </section>
        ))}
      </motion.div>
    </div>
  );
}

export default function AppView(props: AppViewProps) {
  return (
    <SwipeProvider>
      <AppViewInner {...props} />
    </SwipeProvider>
  );
}
