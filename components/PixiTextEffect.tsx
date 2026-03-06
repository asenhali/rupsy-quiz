"use client";

import { useEffect, useRef } from "react";

interface PixiTextEffectProps {
  text: string;
  effect: string;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  baseSize: number;
}

// Color stops for fire lifecycle (pre-computed)
const FIRE_COLORS = [
  { r: 255, g: 255, b: 255 },   // white core
  { r: 255, g: 230, b: 140 },   // bright yellow
  { r: 255, g: 215, b: 0 },     // gold
  { r: 255, g: 140, b: 0 },     // orange
  { r: 255, g: 69, b: 0 },      // red-orange
  { r: 200, g: 30, b: 0 },      // deep red
];

function getFireColor(t: number): { r: number; g: number; b: number } {
  const idx = t * (FIRE_COLORS.length - 1);
  const i = Math.min(Math.floor(idx), FIRE_COLORS.length - 2);
  const f = idx - i;
  const a = FIRE_COLORS[i], b = FIRE_COLORS[i + 1];
  return {
    r: a.r + (b.r - a.r) * f,
    g: a.g + (b.g - a.g) * f,
    b: a.b + (b.b - a.b) * f,
  };
}

function getFireAlpha(t: number): number {
  if (t < 0.1) return t / 0.1 * 0.9;          // fade in
  if (t < 0.4) return 0.9;                      // full brightness
  return 0.9 * (1 - (t - 0.4) / 0.6);          // fade out
}

export default function PixiTextEffect({
  text,
  effect,
  fontSize = 14,
  className = "",
  style = {},
}: PixiTextEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (effect !== "fire" || !containerRef.current) return;

    let destroyed = false;

    async function init() {
      const PIXI = await import("pixi.js");

      if (destroyed || !containerRef.current) return;

      const app = new PIXI.Application();

      // Measure text width using a temp canvas
      const measureCanvas = document.createElement("canvas");
      const measureCtx = measureCanvas.getContext("2d")!;
      measureCtx.font = `bold ${fontSize}px Montserrat, sans-serif`;
      const measured = measureCtx.measureText(text);
      const textWidth = Math.ceil(measured.width);
      const flameHeight = Math.ceil(fontSize * 0.9);
      const canvasWidth = textWidth + 8;
      const canvasHeight = Math.ceil(fontSize * 1.4) + flameHeight;

      await app.init({
        width: canvasWidth,
        height: canvasHeight,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (destroyed) {
        app.destroy(true);
        return;
      }

      containerRef.current!.appendChild(app.canvas);
      app.canvas.style.display = "block";

      // --- Text layers ---
      const textY = flameHeight;

      // Glow layer (blurred duplicate for bloom)
      const glowText = new PIXI.Text({
        text,
        style: {
          fontFamily: "Montserrat, sans-serif",
          fontWeight: "bold",
          fontSize,
          fill: 0xFF4500,
        },
      });
      glowText.x = 4;
      glowText.y = textY;
      glowText.alpha = 0.45;
      glowText.filters = [new PIXI.BlurFilter({ strength: 6 })];
      app.stage.addChild(glowText);

      // Main text layer
      const mainText = new PIXI.Text({
        text,
        style: {
          fontFamily: "Montserrat, sans-serif",
          fontWeight: "bold",
          fontSize,
          fill: 0xFF4500,
        },
      });
      mainText.x = 4;
      mainText.y = textY;
      app.stage.addChild(mainText);

      // --- Particle system ---
      const particleContainer = new PIXI.Container();
      particleContainer.blendMode = "add";
      app.stage.addChild(particleContainer);

      // Create a shared soft circle texture
      const circleGfx = new PIXI.Graphics();
      circleGfx.circle(0, 0, 8);
      circleGfx.fill({ color: 0xFFFFFF });
      circleGfx.filters = [new PIXI.BlurFilter({ strength: 2.5 })];
      const circleTexture = app.renderer.generateTexture({
        target: circleGfx,
        resolution: 2,
      });
      circleGfx.destroy();

      const maxParticles = Math.min(50, Math.max(30, Math.floor(textWidth / 2.5)));
      const particles: FireParticle[] = [];
      const sprites: InstanceType<typeof PIXI.Sprite>[] = [];

      function spawnParticle(): FireParticle {
        return {
          x: Math.random() * textWidth + 4,
          y: textY + (Math.random() * 3 - 1),
          vx: (Math.random() - 0.5) * 1.0,
          vy: -(Math.random() * 1.8 + 0.6),
          life: 0,
          maxLife: 0.4 + Math.random() * 0.6,
          baseSize: 0.15 + Math.random() * 0.2,
        };
      }

      for (let i = 0; i < maxParticles; i++) {
        const p = spawnParticle();
        // Stagger initial life so particles don't all spawn at once
        p.life = Math.random() * p.maxLife;
        particles.push(p);

        const sprite = new PIXI.Sprite(circleTexture);
        sprite.anchor.set(0.5);
        particleContainer.addChild(sprite);
        sprites.push(sprite);
      }

      // Animation loop
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime / 60; // normalize to seconds

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.life += dt;

          if (p.life >= p.maxLife) {
            // Respawn
            const np = spawnParticle();
            particles[i] = np;
            // Update sprite immediately for new particle
            const s = sprites[i];
            s.x = np.x;
            s.y = np.y;
            s.alpha = 0;
            s.scale.set(np.baseSize * 0.5);
            continue;
          }

          // Physics
          p.x += p.vx * dt * 40;
          p.y += p.vy * dt * 40;
          p.vx += (Math.random() - 0.5) * dt * 4;

          const t = p.life / p.maxLife; // 0 = born, 1 = dead

          // Scale: start small, grow, then shrink
          let scale: number;
          if (t < 0.2) {
            scale = p.baseSize * (0.5 + t / 0.2 * 0.8);
          } else if (t < 0.5) {
            scale = p.baseSize * 1.3;
          } else {
            scale = p.baseSize * 1.3 * (1 - (t - 0.5) / 0.5 * 0.7);
          }

          const color = getFireColor(t);
          const alpha = getFireAlpha(t);

          const s = sprites[i];
          s.x = p.x;
          s.y = p.y;
          s.scale.set(Math.max(0.05, scale));
          s.alpha = Math.max(0, alpha);
          s.tint = (Math.round(color.r) << 16) | (Math.round(color.g) << 8) | Math.round(color.b);
        }
      });

      appRef.current = {
        destroy: () => {
          app.ticker.stop();
          app.stage.removeChildren();
          // Remove canvas from DOM manually instead of app.destroy()
          // to avoid PixiJS v8 texture pool crash during renderer teardown
          try { app.canvas.parentNode?.removeChild(app.canvas); } catch {}
          try { app.destroy(true, { children: false }); } catch {}
        },
      };
    }

    init();

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, [text, effect, fontSize]);

  if (effect !== "fire") {
    return <span className={className} style={style}>{text}</span>;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        lineHeight: 0,
        ...style,
      }}
    />
  );
}
