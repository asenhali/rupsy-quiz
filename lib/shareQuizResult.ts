const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920; // Instagram Story 9:16
const CREAM = "#f3e6c0";

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
  totalPlayers?: number
): void {
  const w = CARD_WIDTH;
  const h = CARD_HEIGHT;

  // 1. Background gradient: #0a0f1a top → #1b2833 middle → #0a0f1a bottom
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, "#0a0f1a");
  gradient.addColorStop(0.5, "#1b2833");
  gradient.addColorStop(1, "#0a0f1a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Radial glow in center (gold, 5–8% opacity)
  const glow = ctx.createRadialGradient(w / 2, 960, 0, w / 2, 960, 600);
  glow.addColorStop(0, "rgba(255, 215, 0, 0.07)");
  glow.addColorStop(0.5, "rgba(255, 215, 0, 0.05)");
  glow.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Decorative horizontal lines (cream 10% opacity)
  ctx.strokeStyle = "rgba(243, 230, 192, 0.1)";
  ctx.lineWidth = 1;
  const lineYs = [400, 550, 950, 1050, 1350, 1750];
  for (const ly of lineYs) {
    const lineW = w * 0.4;
    ctx.beginPath();
    ctx.moveTo((w - lineW) / 2, ly);
    ctx.lineTo((w + lineW) / 2, ly);
    ctx.stroke();
  }

  ctx.textBaseline = "middle";

  // 2. Top section (y ~250)
  ctx.fillStyle = CREAM;
  ctx.font = "bold 96px sans-serif";
  drawTextWithSpacing(ctx, "RUPSY", w / 2, 220, 12);
  ctx.globalAlpha = 0.6;
  ctx.font = "bold 36px sans-serif";
  drawTextWithSpacing(ctx, "TÝŽDENNÝ KVÍZ", w / 2, 290, 6);
  ctx.globalAlpha = 1;

  // 3. Center — score section
  const scoreY = 750;
  const dividerW = w * 0.4;

  ctx.strokeStyle = "rgba(243, 230, 192, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo((w - dividerW) / 2, scoreY - 120);
  ctx.lineTo((w + dividerW) / 2, scoreY - 120);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo((w - dividerW) / 2, scoreY + 120);
  ctx.lineTo((w + dividerW) / 2, scoreY + 120);
  ctx.stroke();

  ctx.fillStyle = CREAM;
  ctx.font = "bold 220px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(score), w / 2, scoreY - 20);
  ctx.font = "bold 32px sans-serif";
  drawTextWithSpacing(ctx, "BODOV", w / 2, scoreY + 90, 4);

  // 4. Rank section (y ~1150)
  if (rank != null) {
    const badgeY = 1150;
    const badgeW = 420;
    const badgeH = 100;
    ctx.strokeStyle = "rgba(243, 230, 192, 0.2)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(243, 230, 192, 0.03)";
    roundRect(ctx, (w - badgeW) / 2, badgeY - badgeH / 2, badgeW, badgeH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = CREAM;
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`#${rank} na Slovensku`, w / 2, badgeY - 8);

    if (totalPlayers != null) {
      ctx.globalAlpha = 0.4;
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(`z ${totalPlayers} hráčov`, w / 2, badgeY + 38);
      ctx.globalAlpha = 1;
    }
  }

  // 5. Bottom (y ~1550)
  const bottomY = 1550;
  ctx.fillStyle = CREAM;
  ctx.font = "bold 44px sans-serif";
  ctx.fillText("rupsy.sk/kviz", w / 2, bottomY);
  ctx.globalAlpha = 0.5;
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("Zahraj si aj ty", w / 2, bottomY + 56);
  ctx.globalAlpha = 1;

  // 6. Subtle noise overlay (random dots, 3–5% opacity)
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  const dotCount = 1200;
  for (let i = 0; i < dotCount; i++) {
    const dx = Math.random() * w;
    const dy = Math.random() * h;
    ctx.beginPath();
    ctx.arc(dx, dy, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function generateShareImage(
  score: number,
  rank: number | null,
  totalPlayers?: number
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
    drawShareCard(ctx, score, rank, totalPlayers);
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
  totalPlayers?: number
): Promise<void> {
  const shareText = `Získal som ${score} bodov v RUPSY kvíze! 🏆 rupsy.sk/kviz`;
  const clipboardText =
    rank != null
      ? `Získal som ${score} bodov v RUPSY kvíze! 🏆 #${rank} na Slovensku — rupsy.sk/kviz`
      : shareText;

  try {
    const blob = await generateShareImage(score, rank, totalPlayers);
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
