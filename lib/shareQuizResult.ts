const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920; // Instagram Story 9:16
const CREAM = "#f3e6c0";
const CX = 540; // center x

const CTA_OPTIONS = [
  "Porazíš ma? 😏",
  "Toto prekoná len málo ľudí 🔥",
  "Skús ma prekabátiť 💪",
  "Trúfneš si? 🎯",
  "Dokážeš viac? 👀",
];

function formatWeekId(weekId: string): string {
  const wMatch = weekId.match(/^\d{4}-W(\d{1,2})$/i);
  if (wMatch) {
    const year = weekId.slice(0, 4);
    return `Týždeň ${parseInt(wMatch[1], 10)} / ${year}`;
  }
  const dMatch = weekId.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dMatch) {
    return `Týždeň ${dMatch[3]}.${dMatch[2]}.${dMatch[1]}`;
  }
  return weekId;
}

/** Draw text with letter-spacing (canvas has no native letter-spacing) */
function drawTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number
): void {
  const chars = [...text];
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const metrics = ctx.measureText(text);
  const totalWidth = metrics.width + (chars.length - 1) * letterSpacing;
  let cx = x - totalWidth / 2;
  for (const char of chars) {
    ctx.fillText(char, cx, y);
    cx += ctx.measureText(char).width + letterSpacing;
  }
  ctx.textAlign = "center";
}

function drawShareCard(
  ctx: CanvasRenderingContext2D,
  score: number,
  rank: number | null,
  totalPlayers?: number,
  weekId?: string
): void {
  const w = CARD_WIDTH;
  const h = CARD_HEIGHT;

  // Background gradient: #0a0f1a top → #1b2833 center → #0a0f1a bottom
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, "#0a0f1a");
  gradient.addColorStop(0.5, "#1b2833");
  gradient.addColorStop(1, "#0a0f1a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // One subtle radial glow: center (540, 750), radius ~400, gold 6%
  const glow = ctx.createRadialGradient(CX, 750, 0, CX, 750, 400);
  glow.addColorStop(0, "rgba(255, 215, 0, 0.06)");
  glow.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // y=320: RUPSY — bold 72px, cream, wide letter-spacing
  ctx.fillStyle = CREAM;
  ctx.font = "bold 72px sans-serif";
  drawTextWithSpacing(ctx, "RUPSY", CX, 320, 10);

  // y=400: TÝŽDENNÝ KVÍZ — bold 32px, cream 50%
  ctx.globalAlpha = 0.5;
  ctx.font = "bold 32px sans-serif";
  drawTextWithSpacing(ctx, "TÝŽDENNÝ KVÍZ", CX, 400, 4);
  ctx.globalAlpha = 1;

  // y=720: score — bold 220px, cream (hero)
  ctx.fillStyle = CREAM;
  ctx.font = "bold 220px sans-serif";
  ctx.fillText(String(score), CX, 720);

  // y=820: BODOV — bold 36px, cream 50%
  ctx.globalAlpha = 0.5;
  ctx.font = "bold 36px sans-serif";
  drawTextWithSpacing(ctx, "BODOV", CX, 820, 4);
  ctx.globalAlpha = 1;

  // y=1020: #X na Slovensku — bold 44px, cream
  // y=1080: z Y hráčov — 28px, cream 40%
  if (rank != null) {
    ctx.fillStyle = CREAM;
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(`#${rank} na Slovensku`, CX, 1020);
    if (totalPlayers != null) {
      ctx.globalAlpha = 0.4;
      ctx.font = "28px sans-serif";
      ctx.fillText(`z ${totalPlayers} hráčov`, CX, 1080);
      ctx.globalAlpha = 1;
    }
  }

  // y=1220: week — Týždeň 9 / 2026
  if (weekId) {
    ctx.globalAlpha = 0.35;
    ctx.font = "28px sans-serif";
    ctx.fillText(formatWeekId(weekId), CX, 1220);
    ctx.globalAlpha = 1;
  }

  // y=1480: random CTA — bold 38px, cream
  const ctaIndex = Math.floor(Math.random() * CTA_OPTIONS.length);
  ctx.fillStyle = CREAM;
  ctx.font = "bold 38px sans-serif";
  ctx.fillText(CTA_OPTIONS[ctaIndex], CX, 1480);

  // y=1680: rupsy.sk/kviz — bold 36px, cream 70%
  ctx.globalAlpha = 0.7;
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("rupsy.sk/kviz", CX, 1680);
  ctx.globalAlpha = 1;
}

export function generateShareImage(
  score: number,
  rank: number | null,
  totalPlayers?: number,
  weekId?: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas 2d unavailable"));
      return;
    }
    drawShareCard(ctx, score, rank, totalPlayers, weekId);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      "image/png",
      0.95
    );
  });
}

export async function shareQuizResult(
  score: number,
  rank: number | null,
  onToast?: (message: string) => void,
  totalPlayers?: number,
  weekId?: string
): Promise<void> {
  const shareText = `Získal som ${score} bodov v RUPSY kvíze! 🏆 rupsy.sk/kviz`;
  const clipboardText =
    rank != null
      ? `Získal som ${score} bodov v RUPSY kvíze! 🏆 #${rank} na Slovensku — rupsy.sk/kviz`
      : shareText;

  try {
    const blob = await generateShareImage(score, rank, totalPlayers, weekId);
    const file = new File([blob], "rupsy-kviz.png", { type: "image/png" });

    // 1. Try: navigator.share with files (image sharing)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      let canShareFiles = false;
      try {
        canShareFiles =
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file], text: shareText });
      } catch {
        // canShare can throw on some browsers
      }

      if (canShareFiles) {
        console.log("[shareQuizResult] Attempting image share (files + text)");
        try {
          await navigator.share({ files: [file], text: shareText });
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          console.log("[shareQuizResult] Image share failed:", err);
        }
      } else {
        console.log("[shareQuizResult] Image share not supported (canShare=false or unavailable)");
      }

      // 2. Try: navigator.share with text only (widely supported on mobile)
      console.log("[shareQuizResult] Attempting text-only share");
      try {
        await navigator.share({ text: clipboardText });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.log("[shareQuizResult] Text-only share failed:", err);
      }
    } else {
      console.log("[shareQuizResult] navigator.share not available");
    }
  } catch (err) {
    console.log("[shareQuizResult] Share flow error:", err);
  }

  // 3. Fallback: clipboard copy + toast
  console.log("[shareQuizResult] Falling back to clipboard copy");
  await fallbackToClipboard(clipboardText, onToast);
}

async function fallbackToClipboard(
  text: string,
  onToast?: (message: string) => void
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    onToast?.("Skopírované do schránky!");
  } catch {
    onToast?.("Nepodarilo sa skopírovať");
  }
}
