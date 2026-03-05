"use client";

import { useCallback, useEffect, useRef } from "react";

const GOLD_PALETTE = ["#FFD700", "#FFA500", "#FFEC8B", "#FFD900", "#FFF8DC", "#FFFFFF"];
const BURST3_PALETTE = ["#FFD700", "#FFF8DC", "#FFFFFF", "#FFFACD", "#FFEC8B", "#FFFFFF"];
const GRAVITY = 0.15;
const PARTICLES_PER_BURST = 50;
const BURST_1_AT_MS = 0;
const BURST_2_AT_MS = 600;
const BURST_3_AT_MS = 1200;
const MAX_DURATION_MS = 2600;
const AFTERGLOW_DELAY_MS = 400;
const AFTERGLOW_DURATION_MS = 600;
const AFTERGLOW_START_R = 50;
const AFTERGLOW_END_R = 280;
const AFTERGLOW_OPACITY_START = 0.35;
const AFTERGLOW_OPACITY_END = 0;

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
};

function createParticle(
  spawnX: number,
  spawnY: number,
  burstIndex: 0 | 1 | 2
): Particle {
  const baseAngle = Math.random() * Math.PI * 2;
  const angleOffset = burstIndex === 1 ? (Math.random() - 0.5) * 0.4 : 0;
  const angle = baseAngle + angleOffset;
  const baseSpeed = burstIndex === 0 ? 8 + Math.random() * 14 : burstIndex === 1 ? 9 + Math.random() * 16 : 12 + Math.random() * 18;
  const speed = baseSpeed;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  const size = 2.5 + Math.random() * 4;
  const palette = burstIndex === 2 ? BURST3_PALETTE : GOLD_PALETTE;
  const color = palette[Math.floor(Math.random() * palette.length)];
  const maxLife = 35 + Math.random() * 45;
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
  const burst1FiredRef = useRef(false);
  const burst2FiredRef = useRef(false);
  const burst3FiredRef = useRef(false);

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

    startTimeRef.current = Date.now();
    particlesRef.current = [];
    burst1FiredRef.current = false;
    burst2FiredRef.current = false;
    burst3FiredRef.current = false;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;

      if (elapsed >= BURST_1_AT_MS && !burst1FiredRef.current) {
        burst1FiredRef.current = true;
        for (let i = 0; i < PARTICLES_PER_BURST; i++) {
          particlesRef.current.push(createParticle(spawnX, spawnY, 0));
        }
      }
      if (elapsed >= BURST_2_AT_MS && !burst2FiredRef.current) {
        burst2FiredRef.current = true;
        for (let i = 0; i < PARTICLES_PER_BURST; i++) {
          particlesRef.current.push(createParticle(spawnX, spawnY, 1));
        }
      }
      if (elapsed >= BURST_3_AT_MS && !burst3FiredRef.current) {
        burst3FiredRef.current = true;
        for (let i = 0; i < PARTICLES_PER_BURST; i++) {
          particlesRef.current.push(createParticle(spawnX, spawnY, 2));
        }
      }

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
        ctx.beginPath();
        ctx.arc(localX, localY, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        alive.push(p);
      }
      particlesRef.current = alive;

      if (
        burst3FiredRef.current &&
        particlesRef.current.length === 0 &&
        elapsed > BURST_3_AT_MS + 400
      ) {
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
