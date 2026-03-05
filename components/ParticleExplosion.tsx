"use client";

import { useCallback, useEffect, useRef } from "react";

const GOLD_PALETTE = ["#FFD700", "#FFA500", "#FFEC8B", "#FFD900", "#FFF8DC", "#FFFFFF"];
const GRAVITY = 0.15;
const MAX_PARTICLES = 80;
const MIN_PARTICLES = 60;
const MAX_LIFETIME = 80;
const MIN_LIFETIME = 40;
const SPARK_COUNT_MIN = 15;
const SPARK_COUNT_MAX = 20;
const MAX_DURATION_MS = 1500;
const AFTERGLOW_DELAY_MS = 500;
const AFTERGLOW_DURATION_MS = 800;
const AFTERGLOW_START_R = 50;
const AFTERGLOW_END_R = 300;
const AFTERGLOW_OPACITY_START = 0.4;
const AFTERGLOW_OPACITY_END = 0;

const SPARK_LIFETIME_MAX = 40;
const SPARK_LIFETIME_MIN = 20;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  isSpark: boolean;
};

function createParticle(spawnX: number, spawnY: number, isSpark: boolean): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = isSpark
    ? 12 + Math.random() * 18
    : 8 + Math.random() * 17;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  const size = isSpark ? 1 + Math.random() : 3 + Math.random() * 5;
  const maxLife = isSpark
    ? SPARK_LIFETIME_MIN + Math.random() * (SPARK_LIFETIME_MAX - SPARK_LIFETIME_MIN)
    : MIN_LIFETIME + Math.random() * (MAX_LIFETIME - MIN_LIFETIME);
  const color = GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)];
  return {
    x: spawnX,
    y: spawnY,
    vx,
    vy,
    size,
    color,
    opacity: 1,
    life: maxLife,
    maxLife,
    isSpark,
  };
}

export default function ParticleExplosion({
  spawnX,
  spawnY,
  onComplete,
}: {
  spawnX: number;
  spawnY: number;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const completedRef = useRef(false);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (canvasRef.current) {
      canvasRef.current.style.display = "none";
    }
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 400;
    const half = size / 2;
    const left = spawnX - half;
    const top = spawnY - half;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particleCount =
      MIN_PARTICLES + Math.floor(Math.random() * (MAX_PARTICLES - MIN_PARTICLES + 1));
    const sparkCount =
      SPARK_COUNT_MIN +
      Math.floor(Math.random() * (SPARK_COUNT_MAX - SPARK_COUNT_MIN + 1));
    const normalCount = Math.max(0, particleCount - sparkCount);

    for (let i = 0; i < sparkCount; i++) {
      particlesRef.current.push(createParticle(spawnX, spawnY, true));
    }
    for (let i = 0; i < normalCount; i++) {
      particlesRef.current.push(createParticle(spawnX, spawnY, false));
    }

    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;

      if (elapsed >= MAX_DURATION_MS) {
        complete();
        return;
      }

      ctx.clearRect(0, 0, size, size);

      const afterglowStart = AFTERGLOW_DELAY_MS;
      const afterglowEnd = afterglowStart + AFTERGLOW_DURATION_MS;
      if (elapsed >= afterglowStart && elapsed <= afterglowEnd) {
        const t = (elapsed - afterglowStart) / AFTERGLOW_DURATION_MS;
        const r = AFTERGLOW_START_R + (AFTERGLOW_END_R - AFTERGLOW_START_R) * t;
        const opacity =
          AFTERGLOW_OPACITY_START +
          (AFTERGLOW_OPACITY_END - AFTERGLOW_OPACITY_START) * t;
        const gradient = ctx.createRadialGradient(
          half,
          half,
          0,
          half,
          half,
          r
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${opacity * 0.5})`);
        gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY;
        p.life--;
        if (p.life <= 0) continue;

        const lifeRatio = p.life / p.maxLife;
        p.opacity = lifeRatio;

        const localX = p.x - left;
        const localY = p.y - top;
        if (localX < -10 || localX > size + 10 || localY < -10 || localY > size + 10) continue;

        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        if (p.isSpark) {
          const s = Math.max(1, Math.min(2, p.size));
          ctx.fillRect(localX - s / 2, localY - s / 2, s, s);
        } else {
          ctx.beginPath();
          ctx.arc(localX, localY, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        alive.push(p);
      }
      particlesRef.current = alive;

      if (particlesRef.current.length === 0 && elapsed > 500) {
        complete();
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      canvas.style.display = "none";
    };
  }, [spawnX, spawnY, complete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed z-[102] pointer-events-none"
      style={{
        position: "fixed",
        width: 400,
        height: 400,
        background: "transparent",
      }}
    />
  );
}
