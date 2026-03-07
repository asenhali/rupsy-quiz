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
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  baseSize: number;
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
  return {
    r: a.r + (b.r - a.r) * f,
    g: a.g + (b.g - a.g) * f,
    b: a.b + (b.b - a.b) * f,
  };
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
  progress: number; // 0-1 how far the bolt has traveled
  speed: number; // progress per second
  startY: number;
  active: boolean;
  cooldown: number; // seconds until next bolt spawns here
  branches: { startIdx: number; segments: { x: number; y: number }[] }[];
  sparks: LightningSpark[];
}

interface LightningSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

function generateBoltPath(startY: number, textWidth: number, fontSize: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [{ x: 0, y: startY }];
  let x = 0;
  let y = startY;
  const halfHeight = fontSize * 0.4;

  while (x < textWidth) {
    const segLen = 5 + Math.random() * 10;
    x += segLen;
    const offsetRange = 3 + Math.random() * 5;
    y = startY + (Math.random() - 0.5) * 2 * offsetRange;
    y = Math.max(startY - halfHeight, Math.min(startY + halfHeight, y));
    points.push({ x: Math.min(x, textWidth), y });
  }
  return points;
}

function generateBranch(parentSegments: { x: number; y: number }[], startIdx: number, fontSize: number): { x: number; y: number }[] {
  const start = parentSegments[startIdx];
  const branchLen = 2 + Math.floor(Math.random() * 3);
  const dir = Math.random() > 0.5 ? 1 : -1;
  const points: { x: number; y: number }[] = [{ x: start.x, y: start.y }];
  let x = start.x;
  let y = start.y;

  for (let i = 0; i < branchLen; i++) {
    x += 3 + Math.random() * 5;
    y += dir * (2 + Math.random() * 4);
    const halfHeight = fontSize * 0.6;
    y = Math.max(start.y - halfHeight, Math.min(start.y + halfHeight, y));
    points.push({ x, y });
  }
  return points;
}

// ════════════════════════════════════════════════
//  SHARED HELPERS
// ════════════════════════════════════════════════

function measureText(text: string, fontSize: number): number {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = `bold ${fontSize}px Montserrat, sans-serif`;
  return Math.ceil(ctx.measureText(text).width);
}

const SUPPORTED_EFFECTS = ["fire", "lightning"];

// ════════════════════════════════════════════════
//  COMPONENT
// ════════════════════════════════════════════════

export default function PixiTextEffect({
  text,
  effect,
  fontSize = 14,
  className = "",
  style = {},
}: PixiTextEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<{ destroy: () => void } | null>(null);

  // ── FIRE EFFECT ──
  useEffect(() => {
    if (effect !== "fire" || !containerRef.current) return;

    let destroyed = false;

    async function init() {
      const PIXI = await import("pixi.js");
      if (destroyed || !containerRef.current) return;

      const app = new PIXI.Application();
      const textWidth = measureText(text, fontSize);
      const flameHeight = Math.ceil(fontSize * 0.9);
      const canvasWidth = textWidth + 2;
      const canvasHeight = Math.ceil(fontSize * 1.4) + flameHeight;

      await app.init({
        width: canvasWidth, height: canvasHeight,
        backgroundAlpha: 0, antialias: true,
        resolution: window.devicePixelRatio || 1, autoDensity: true,
      });
      if (destroyed) { try { app.destroy(true); } catch {} return; }

      containerRef.current!.appendChild(app.canvas);
      app.canvas.style.display = "block";

      const textY = flameHeight;

      const glowText = new PIXI.Text({
        text, style: { fontFamily: "Montserrat, sans-serif", fontWeight: "bold", fontSize, fill: 0xFF4500 },
      });
      glowText.x = 0; glowText.y = textY; glowText.alpha = 0.45;
      glowText.filters = [new PIXI.BlurFilter({ strength: 6 })];
      app.stage.addChild(glowText);

      const mainText = new PIXI.Text({
        text, style: { fontFamily: "Montserrat, sans-serif", fontWeight: "bold", fontSize, fill: 0xFF4500 },
      });
      mainText.x = 0; mainText.y = textY;
      app.stage.addChild(mainText);

      const particleContainer = new PIXI.Container();
      particleContainer.blendMode = "add";
      app.stage.addChild(particleContainer);

      const circleGfx = new PIXI.Graphics();
      circleGfx.circle(0, 0, 8);
      circleGfx.fill({ color: 0xFFFFFF });
      circleGfx.filters = [new PIXI.BlurFilter({ strength: 2.5 })];
      const circleTexture = app.renderer.generateTexture({ target: circleGfx, resolution: 2 });
      circleGfx.destroy();

      const maxParticles = Math.min(50, Math.max(30, Math.floor(textWidth / 2.5)));
      const particles: FireParticle[] = [];
      const sprites: InstanceType<typeof PIXI.Sprite>[] = [];

      function spawnParticle(): FireParticle {
        return {
          x: Math.random() * textWidth, y: textY + (Math.random() * 3 - 1),
          vx: (Math.random() - 0.5) * 1.0, vy: -(Math.random() * 1.8 + 0.6),
          life: 0, maxLife: 0.4 + Math.random() * 0.6, baseSize: 0.15 + Math.random() * 0.2,
        };
      }

      for (let i = 0; i < maxParticles; i++) {
        const p = spawnParticle();
        p.life = Math.random() * p.maxLife;
        particles.push(p);
        const sprite = new PIXI.Sprite(circleTexture);
        sprite.anchor.set(0.5);
        particleContainer.addChild(sprite);
        sprites.push(sprite);
      }

      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime / 60;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.life += dt;
          if (p.life >= p.maxLife) {
            const np = spawnParticle();
            particles[i] = np;
            const s = sprites[i];
            s.x = np.x; s.y = np.y; s.alpha = 0; s.scale.set(np.baseSize * 0.5);
            continue;
          }
          p.x += p.vx * dt * 40; p.y += p.vy * dt * 40;
          p.vx += (Math.random() - 0.5) * dt * 4;
          const t = p.life / p.maxLife;
          let scale: number;
          if (t < 0.2) scale = p.baseSize * (0.5 + t / 0.2 * 0.8);
          else if (t < 0.5) scale = p.baseSize * 1.3;
          else scale = p.baseSize * 1.3 * (1 - (t - 0.5) / 0.5 * 0.7);
          const color = getFireColor(t);
          const alpha = getFireAlpha(t);
          const s = sprites[i];
          s.x = p.x; s.y = p.y;
          s.scale.set(Math.max(0.05, scale));
          s.alpha = Math.max(0, alpha);
          s.tint = (Math.round(color.r) << 16) | (Math.round(color.g) << 8) | Math.round(color.b);
        }
      });

      appRef.current = {
        destroy: () => {
          app.ticker.stop();
          app.stage.removeChildren();
          try { app.canvas.parentNode?.removeChild(app.canvas); } catch {}
          try { app.destroy(true, { children: false }); } catch {}
        },
      };
    }

    init();
    return () => { destroyed = true; if (appRef.current) { appRef.current.destroy(); appRef.current = null; } };
  }, [text, effect, fontSize]);

  // ── LIGHTNING EFFECT ──
  useEffect(() => {
    if (effect !== "lightning" || !containerRef.current) return;

    let destroyed = false;

    async function init() {
      const PIXI = await import("pixi.js");
      if (destroyed || !containerRef.current) return;

      const app = new PIXI.Application();
      const textWidth = measureText(text, fontSize);
      const padding = Math.ceil(fontSize * 0.3);
      const canvasWidth = textWidth + 2;
      const canvasHeight = Math.ceil(fontSize * 1.4) + padding * 2;

      await app.init({
        width: canvasWidth, height: canvasHeight,
        backgroundAlpha: 0, antialias: true,
        resolution: window.devicePixelRatio || 1, autoDensity: true,
      });
      if (destroyed) { try { app.destroy(true); } catch {} return; }

      containerRef.current!.appendChild(app.canvas);
      app.canvas.style.display = "block";

      const textY = padding;
      const textCenterY = textY + fontSize * 0.55;

      // Glow layer
      const glowText = new PIXI.Text({
        text, style: { fontFamily: "Montserrat, sans-serif", fontWeight: "bold", fontSize, fill: 0xFFD600 },
      });
      glowText.x = 0; glowText.y = textY; glowText.alpha = 0.4;
      glowText.filters = [new PIXI.BlurFilter({ strength: 5 })];
      app.stage.addChild(glowText);

      // Main text
      const mainText = new PIXI.Text({
        text, style: { fontFamily: "Montserrat, sans-serif", fontWeight: "bold", fontSize, fill: 0xFFD600 },
      });
      mainText.x = 0; mainText.y = textY;
      app.stage.addChild(mainText);

      // Flash overlay text (white, hidden by default)
      const flashText = new PIXI.Text({
        text, style: { fontFamily: "Montserrat, sans-serif", fontWeight: "bold", fontSize, fill: 0xFFFFFF },
      });
      flashText.x = 0; flashText.y = textY; flashText.alpha = 0;
      flashText.blendMode = "add";
      app.stage.addChild(flashText);

      // Lightning drawing layer
      const boltGfx = new PIXI.Graphics();
      boltGfx.blendMode = "add";
      app.stage.addChild(boltGfx);

      // Spark container
      const sparkContainer = new PIXI.Container();
      sparkContainer.blendMode = "add";
      app.stage.addChild(sparkContainer);

      // Spark texture
      const sparkGfx = new PIXI.Graphics();
      sparkGfx.circle(0, 0, 4);
      sparkGfx.fill({ color: 0xFFFFFF });
      sparkGfx.filters = [new PIXI.BlurFilter({ strength: 1.5 })];
      const sparkTexture = app.renderer.generateTexture({ target: sparkGfx, resolution: 2 });
      sparkGfx.destroy();

      // Lightning state
      const bolts: LightningBolt[] = [
        { segments: [], progress: 0, speed: 0, startY: 0, active: false, cooldown: Math.random() * 0.5, branches: [], sparks: [] },
        { segments: [], progress: 0, speed: 0, startY: 0, active: false, cooldown: 0.8 + Math.random() * 0.5, branches: [], sparks: [] },
      ];

      const sparkSprites: InstanceType<typeof PIXI.Sprite>[] = [];
      const maxSparks = 15;
      for (let i = 0; i < maxSparks; i++) {
        const s = new PIXI.Sprite(sparkTexture);
        s.anchor.set(0.5);
        s.alpha = 0;
        s.scale.set(0.1);
        sparkContainer.addChild(s);
        sparkSprites.push(s);
      }
      let sparkIdx = 0;

      // Flash state
      let flashTimer = 2.5 + Math.random() * 2;
      let flashAlpha = 0;

      function spawnBolt(bolt: LightningBolt) {
        bolt.startY = textCenterY + (Math.random() - 0.5) * fontSize * 0.5;
        bolt.segments = generateBoltPath(bolt.startY, textWidth, fontSize);
        bolt.progress = 0;
        bolt.speed = 1 / (0.3 + Math.random() * 0.2); // full traverse in 0.3-0.5s
        bolt.active = true;
        bolt.sparks = [];

        // Generate 2-3 branch forks
        bolt.branches = [];
        const numBranches = 2 + Math.floor(Math.random() * 2);
        for (let b = 0; b < numBranches; b++) {
          const startIdx = Math.floor(Math.random() * (bolt.segments.length - 2)) + 1;
          bolt.branches.push({
            startIdx,
            segments: generateBranch(bolt.segments, startIdx, fontSize),
          });
        }
      }

      function emitSpark(x: number, y: number) {
        const sprite = sparkSprites[sparkIdx % maxSparks];
        sparkIdx++;
        sprite.x = x;
        sprite.y = y;
        sprite.alpha = 0.9;
        sprite.scale.set(0.08 + Math.random() * 0.08);
        sprite.tint = Math.random() > 0.5 ? 0xFFFFFF : 0xFFD600;

        // Store velocity in spark tracking
        const boltForSpark = bolts.find(b => b.active);
        if (boltForSpark) {
          boltForSpark.sparks.push({
            x, y,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0,
            maxLife: 0.15 + Math.random() * 0.15,
          });
        }
      }

      // Collect all sparks across bolts for sprite mapping
      let allSparks: LightningSpark[] = [];

      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime / 60;

        // Flash timer
        flashTimer -= dt;
        if (flashTimer <= 0) {
          flashAlpha = 0.8;
          flashTimer = 3 + Math.random() * 2;
        }
        if (flashAlpha > 0) {
          flashAlpha -= dt * 16; // fade in ~0.05s
          if (flashAlpha < 0) flashAlpha = 0;
        }
        flashText.alpha = flashAlpha;

        boltGfx.clear();

        for (const bolt of bolts) {
          if (!bolt.active) {
            bolt.cooldown -= dt;
            if (bolt.cooldown <= 0) {
              spawnBolt(bolt);
            }
            continue;
          }

          bolt.progress += bolt.speed * dt;
          const drawCount = Math.floor(bolt.progress * bolt.segments.length);

          if (drawCount >= bolt.segments.length) {
            bolt.active = false;
            bolt.cooldown = 0.5 + Math.random() * 1.0;
            continue;
          }

          // Draw glow (wider, semi-transparent yellow)
          const visibleSegs = Math.min(drawCount + 1, bolt.segments.length);
          if (visibleSegs > 1) {
            boltGfx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
            for (let i = 1; i < visibleSegs; i++) {
              boltGfx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
            }
            boltGfx.stroke({ width: 6, color: 0xFFD600, alpha: 0.35 });

            // Draw core (thin white)
            boltGfx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
            for (let i = 1; i < visibleSegs; i++) {
              boltGfx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
            }
            boltGfx.stroke({ width: 2, color: 0xFFFFFF, alpha: 0.9 });
          }

          // Draw branches
          for (const branch of bolt.branches) {
            if (drawCount >= branch.startIdx) {
              const branchProgress = Math.min(1, (drawCount - branch.startIdx) / branch.segments.length);
              const branchDraw = Math.floor(branchProgress * branch.segments.length);
              if (branchDraw > 1) {
                boltGfx.moveTo(branch.segments[0].x, branch.segments[0].y);
                for (let i = 1; i < branchDraw; i++) {
                  boltGfx.lineTo(branch.segments[i].x, branch.segments[i].y);
                }
                boltGfx.stroke({ width: 3, color: 0xFFD600, alpha: 0.25 });
                boltGfx.moveTo(branch.segments[0].x, branch.segments[0].y);
                for (let i = 1; i < branchDraw; i++) {
                  boltGfx.lineTo(branch.segments[i].x, branch.segments[i].y);
                }
                boltGfx.stroke({ width: 1, color: 0xFFFFFF, alpha: 0.7 });
              }
            }
          }

          // Emit sparks at the bolt tip
          if (drawCount > 0 && drawCount < bolt.segments.length && Math.random() < 0.4) {
            const tip = bolt.segments[drawCount];
            emitSpark(tip.x, tip.y);
          }

          // Fade bolt tail — alpha decreases for old segments
          const fadeStart = Math.max(0, drawCount - Math.floor(bolt.segments.length * 0.6));
          if (fadeStart > 1) {
            boltGfx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
            for (let i = 1; i < fadeStart; i++) {
              boltGfx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
            }
            boltGfx.stroke({ width: 7, color: 0x000000, alpha: 0.3 });
          }
        }

        // Update sparks
        allSparks = bolts.flatMap(b => b.sparks);
        for (let i = allSparks.length - 1; i >= 0; i--) {
          const sp = allSparks[i];
          sp.life += dt;
          if (sp.life >= sp.maxLife) {
            // Remove from parent bolt
            for (const bolt of bolts) {
              const idx = bolt.sparks.indexOf(sp);
              if (idx !== -1) { bolt.sparks.splice(idx, 1); break; }
            }
          } else {
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
          }
        }

        // Map sparks to sprites
        allSparks = bolts.flatMap(b => b.sparks);
        for (let i = 0; i < maxSparks; i++) {
          const sprite = sparkSprites[i];
          if (i < allSparks.length) {
            const sp = allSparks[i];
            const t = sp.life / sp.maxLife;
            sprite.x = sp.x;
            sprite.y = sp.y;
            sprite.alpha = Math.max(0, 0.9 * (1 - t));
            sprite.scale.set(0.08 * (1 - t * 0.5));
          } else {
            sprite.alpha = 0;
          }
        }
      });

      appRef.current = {
        destroy: () => {
          app.ticker.stop();
          app.stage.removeChildren();
          try { app.canvas.parentNode?.removeChild(app.canvas); } catch {}
          try { app.destroy(true, { children: false }); } catch {}
        },
      };
    }

    init();
    return () => { destroyed = true; if (appRef.current) { appRef.current.destroy(); appRef.current = null; } };
  }, [text, effect, fontSize]);

  if (!SUPPORTED_EFFECTS.includes(effect)) {
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
