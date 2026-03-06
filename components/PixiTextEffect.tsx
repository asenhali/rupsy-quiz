"use client";

import { useEffect, useRef, useCallback } from "react";

interface PixiTextEffectProps {
  text: string;
  effect: string;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export default function PixiTextEffect({
  text,
  effect,
  fontSize = 14,
  className = "",
  style = {},
}: PixiTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const textMetricsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const spawnParticle = useCallback((width: number, topY: number): Particle => {
    return {
      x: Math.random() * width,
      y: topY + (Math.random() * 4 - 2),
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(Math.random() * 1.5 + 0.8),
      life: 0,
      maxLife: 0.4 + Math.random() * 0.6,
      size: 1.5 + Math.random() * 2.5,
    };
  }, []);

  useEffect(() => {
    if (effect !== "fire") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Measure text to size canvas
    const font = `bold ${fontSize}px Montserrat, sans-serif`;
    ctx.font = font;
    const metrics = ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(fontSize * 1.3);
    // Extra space above for flames
    const flameHeight = Math.ceil(fontSize * 0.8);
    const canvasWidth = textWidth + 4;
    const canvasHeight = textHeight + flameHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    textMetricsRef.current = { width: canvasWidth, height: canvasHeight };

    // Text baseline position
    const textX = 2;
    const textY = flameHeight + fontSize;

    // Initialize particles
    const particles = particlesRef.current;
    particles.length = 0;
    const maxParticles = Math.min(50, Math.max(25, Math.floor(textWidth / 3)));
    for (let i = 0; i < maxParticles; i++) {
      particles.push(spawnParticle(textWidth, flameHeight));
    }

    let lastTime = performance.now();

    const getFireColor = (lifeRatio: number): string => {
      // 0 = just born (bright), 1 = about to die (faded)
      if (lifeRatio < 0.15) {
        // White/bright yellow core
        const a = 0.9 - lifeRatio * 2;
        return `rgba(255, 255, 230, ${a})`;
      } else if (lifeRatio < 0.35) {
        // Bright yellow
        return `rgba(255, 215, 0, ${0.85 - lifeRatio * 0.5})`;
      } else if (lifeRatio < 0.6) {
        // Orange
        return `rgba(255, 140, 0, ${0.75 - lifeRatio * 0.4})`;
      } else if (lifeRatio < 0.85) {
        // Red-orange
        return `rgba(255, 69, 0, ${0.6 - lifeRatio * 0.3})`;
      } else {
        // Fade out
        const a = Math.max(0, (1 - lifeRatio) * 2);
        return `rgba(200, 30, 0, ${a})`;
      }
    };

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw fire particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += dt;

        if (p.life >= p.maxLife) {
          // Respawn
          const np = spawnParticle(textWidth, flameHeight);
          particles[i] = np;
          continue;
        }

        p.x += p.vx * dt * 30;
        p.y += p.vy * dt * 30;
        // Add slight wavering
        p.vx += (Math.random() - 0.5) * dt * 3;

        const lifeRatio = p.life / p.maxLife;
        const size = p.size * (1 - lifeRatio * 0.5);

        ctx.beginPath();
        ctx.arc(p.x + 2, p.y, Math.max(0.5, size), 0, Math.PI * 2);
        ctx.fillStyle = getFireColor(lifeRatio);
        ctx.fill();
      }

      // Draw text on top
      ctx.font = font;
      ctx.fillStyle = "#FF4500";
      ctx.fillText(text, textX, textY);

      // Additive glow layer
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = "#FF4500";
      ctx.shadowBlur = 4;
      ctx.fillStyle = "rgba(255, 69, 0, 0.3)";
      ctx.fillText(text, textX, textY);
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [text, effect, fontSize, spawnParticle]);

  if (effect !== "fire") {
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
