"use client";

import { useEffect, useRef } from "react";

interface PixiTextEffectProps {
  text: string;
  effect: string;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ════════════════════════════════════════════════
//  FIRE EFFECT HELPERS
// ════════════════════════════════════════════════

interface FireParticle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; baseSize: number;
}

const FIRE_COLORS = [
  { r: 255, g: 255, b: 255 },
  { r: 255, g: 230, b: 140 },
  { r: 255, g: 215, b: 0 },
  { r: 255, g: 140, b: 0 },
  { r: 255, g: 69, b: 0 },
  { r: 200, g: 30, b: 0 },
];

function getFireColor(t: number): { r: number; g: number; b: number } {
  const idx = t * (FIRE_COLORS.length - 1);
  const i = Math.min(Math.floor(idx), FIRE_COLORS.length - 2);
  const f = idx - i;
  const a = FIRE_COLORS[i], b = FIRE_COLORS[i + 1];
  return { r: a.r + (b.r - a.r) * f, g: a.g + (b.g - a.g) * f, b: a.b + (b.b - a.b) * f };
}

function getFireAlpha(t: number): number {
  if (t < 0.1) return t / 0.1 * 0.9;
  if (t < 0.4) return 0.9;
  return 0.9 * (1 - (t - 0.4) / 0.6);
}

// ════════════════════════════════════════════════
//  LIGHTNING EFFECT HELPERS
// ════════════════════════════════════════════════

interface LightningBolt {
  segments: { x: number; y: number }[];
  progress: number;
  speed: number;
  active: boolean;
  cooldown: number;
  branches: { startIdx: number; segments: { x: number; y: number }[] }[];
}

interface LightningSpark {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
}

function generateBoltPath(startY: number, textWidth: number, fontSize: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [{ x: 0, y: startY }];
  let x = 0, y = startY;
  const halfH = fontSize * 0.4;
  while (x < textWidth) {
    x += 5 + Math.random() * 10;
    y = startY + (Math.random() - 0.5) * 2 * (3 + Math.random() * 5);
    y = Math.max(startY - halfH, Math.min(startY + halfH, y));
    points.push({ x: Math.min(x, textWidth), y });
  }
  return points;
}

function generateBranch(parentSegs: { x: number; y: number }[], startIdx: number, fontSize: number): { x: number; y: number }[] {
  const start = parentSegs[startIdx];
  const dir = Math.random() > 0.5 ? 1 : -1;
  const points: { x: number; y: number }[] = [{ x: start.x, y: start.y }];
  let x = start.x, y = start.y;
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    x += 3 + Math.random() * 5;
    y += dir * (2 + Math.random() * 4);
    y = Math.max(start.y - fontSize * 0.6, Math.min(start.y + fontSize * 0.6, y));
    points.push({ x, y });
  }
  return points;
}

// ════════════════════════════════════════════════
//  SHARED
// ════════════════════════════════════════════════

const SUPPORTED_EFFECTS = ["fire", "lightning"];

// ════════════════════════════════════════════════
//  COMPONENT — Canvas 2D (no WebGL context limits)
// ════════════════════════════════════════════════

export default function PixiTextEffect({
  text,
  effect,
  fontSize = 14,
  className = "",
  style = {},
}: PixiTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // ── FIRE EFFECT ──
  useEffect(() => {
    if (effect !== "fire" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const font = `bold ${fontSize}px Montserrat, sans-serif`;

    ctx.font = font;
    const textWidth = Math.ceil(ctx.measureText(text).width);
    const flameHeight = Math.ceil(fontSize * 0.9);
    const canvasWidth = textWidth + 2;
    const canvasHeight = Math.ceil(fontSize * 1.4) + flameHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    const textY = flameHeight + fontSize;
    const maxParticles = Math.min(50, Math.max(30, Math.floor(textWidth / 2.5)));
    const particles: FireParticle[] = [];

    function spawnParticle(): FireParticle {
      return {
        x: Math.random() * textWidth, y: flameHeight + (Math.random() * 3 - 1),
        vx: (Math.random() - 0.5) * 1.0, vy: -(Math.random() * 1.8 + 0.6),
        life: 0, maxLife: 0.4 + Math.random() * 0.6, baseSize: 2 + Math.random() * 2.5,
      };
    }

    for (let i = 0; i < maxParticles; i++) {
      const p = spawnParticle();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    let lastTime = performance.now();

    function animate(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw particles with additive-like effect using lighter composite
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) { particles[i] = spawnParticle(); continue; }

        p.x += p.vx * dt * 40; p.y += p.vy * dt * 40;
        p.vx += (Math.random() - 0.5) * dt * 4;

        const t = p.life / p.maxLife;
        let size: number;
        if (t < 0.2) size = p.baseSize * (0.5 + t / 0.2 * 0.8);
        else if (t < 0.5) size = p.baseSize * 1.3;
        else size = p.baseSize * 1.3 * (1 - (t - 0.5) / 0.5 * 0.7);

        const color = getFireColor(t);
        const alpha = getFireAlpha(t);

        // Soft glow circle
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, size));
        gradient.addColorStop(0, `rgba(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)},${alpha})`);
        gradient.addColorStop(1, `rgba(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)},0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, size), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // Text glow
      ctx.font = font;
      ctx.shadowColor = "#FF4500";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "rgba(255, 69, 0, 0.4)";
      ctx.fillText(text, 0, textY);
      ctx.shadowBlur = 0;

      // Main text
      ctx.fillStyle = "#FF4500";
      ctx.fillText(text, 0, textY);

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, effect, fontSize]);

  // ── LIGHTNING EFFECT ──
  useEffect(() => {
    if (effect !== "lightning" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const font = `bold ${fontSize}px Montserrat, sans-serif`;

    ctx.font = font;
    const textWidth = Math.ceil(ctx.measureText(text).width);
    const padding = Math.ceil(fontSize * 0.3);
    const canvasWidth = textWidth + 2;
    const canvasHeight = Math.ceil(fontSize * 1.4) + padding * 2;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    const textY = padding + fontSize;
    const textCenterY = padding + fontSize * 0.55;

    const bolts: LightningBolt[] = [
      { segments: [], progress: 0, speed: 0, active: false, cooldown: Math.random() * 0.5, branches: [] },
      { segments: [], progress: 0, speed: 0, active: false, cooldown: 0.8 + Math.random() * 0.5, branches: [] },
    ];

    const sparks: LightningSpark[] = [];
    let flashTimer = 2.5 + Math.random() * 2;
    let flashAlpha = 0;

    function spawnBolt(bolt: LightningBolt) {
      const startY = textCenterY + (Math.random() - 0.5) * fontSize * 0.5;
      bolt.segments = generateBoltPath(startY, textWidth, fontSize);
      bolt.progress = 0;
      bolt.speed = 1 / (0.3 + Math.random() * 0.2);
      bolt.active = true;
      bolt.branches = [];
      const numBranches = 2 + Math.floor(Math.random() * 2);
      for (let b = 0; b < numBranches; b++) {
        const startIdx = Math.floor(Math.random() * (bolt.segments.length - 2)) + 1;
        bolt.branches.push({ startIdx, segments: generateBranch(bolt.segments, startIdx, fontSize) });
      }
    }

    function drawBoltLine(segments: { x: number; y: number }[], count: number, coreWidth: number, glowWidth: number, coreAlpha: number, glowAlpha: number) {
      if (count < 2) return;
      // Glow
      ctx.strokeStyle = `rgba(255, 214, 0, ${glowAlpha})`;
      ctx.lineWidth = glowWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(segments[0].x, segments[0].y);
      for (let i = 1; i < count; i++) ctx.lineTo(segments[i].x, segments[i].y);
      ctx.stroke();

      // Core
      ctx.strokeStyle = `rgba(255, 255, 255, ${coreAlpha})`;
      ctx.lineWidth = coreWidth;
      ctx.beginPath();
      ctx.moveTo(segments[0].x, segments[0].y);
      for (let i = 1; i < count; i++) ctx.lineTo(segments[i].x, segments[i].y);
      ctx.stroke();
    }

    let lastTime = performance.now();

    function animate(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Text glow
      ctx.font = font;
      ctx.shadowColor = "#FFD600";
      ctx.shadowBlur = 5;
      ctx.fillStyle = "rgba(255, 214, 0, 0.35)";
      ctx.fillText(text, 0, textY);
      ctx.shadowBlur = 0;

      // Main text
      ctx.fillStyle = "#FFD600";
      ctx.fillText(text, 0, textY);

      // Flash timer
      flashTimer -= dt;
      if (flashTimer <= 0) {
        flashAlpha = 0.8;
        flashTimer = 3 + Math.random() * 2;
      }
      if (flashAlpha > 0) {
        flashAlpha -= dt * 16;
        if (flashAlpha < 0) flashAlpha = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillText(text, 0, textY);
      }

      // Draw bolts
      ctx.globalCompositeOperation = "lighter";
      for (const bolt of bolts) {
        if (!bolt.active) {
          bolt.cooldown -= dt;
          if (bolt.cooldown <= 0) spawnBolt(bolt);
          continue;
        }

        bolt.progress += bolt.speed * dt;
        const drawCount = Math.min(Math.floor(bolt.progress * bolt.segments.length) + 1, bolt.segments.length);

        if (drawCount >= bolt.segments.length) {
          bolt.active = false;
          bolt.cooldown = 0.5 + Math.random() * 1.0;
          continue;
        }

        // Main bolt
        drawBoltLine(bolt.segments, drawCount, 2, 6, 0.9, 0.35);

        // Branches
        for (const branch of bolt.branches) {
          if (drawCount > branch.startIdx) {
            const branchProgress = Math.min(1, (drawCount - branch.startIdx) / branch.segments.length);
            const branchDraw = Math.max(2, Math.floor(branchProgress * branch.segments.length));
            drawBoltLine(branch.segments, Math.min(branchDraw, branch.segments.length), 1, 3, 0.7, 0.25);
          }
        }

        // Emit sparks at bolt tip
        if (drawCount > 0 && drawCount < bolt.segments.length && Math.random() < 0.4) {
          const tip = bolt.segments[drawCount - 1];
          for (let s = 0; s < 2; s++) {
            sparks.push({
              x: tip.x, y: tip.y,
              vx: (Math.random() - 0.5) * 80,
              vy: (Math.random() - 0.5) * 80,
              life: 0, maxLife: 0.1 + Math.random() * 0.15,
            });
          }
        }
      }

      // Draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.life += dt;
        if (sp.life >= sp.maxLife) { sparks.splice(i, 1); continue; }
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        const t = sp.life / sp.maxLife;
        const alpha = Math.max(0, 0.9 * (1 - t));
        const size = 2 * (1 - t * 0.5);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, Math.max(0.5, size), 0, Math.PI * 2);
        ctx.fill();
      }

      // Keep spark count bounded
      while (sparks.length > 20) sparks.shift();

      ctx.globalCompositeOperation = "source-over";

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, effect, fontSize]);

  if (!SUPPORTED_EFFECTS.includes(effect)) {
    return <span className={className} style={style}>{text}</span>;
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
    />
  );
}
