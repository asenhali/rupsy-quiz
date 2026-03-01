const CARD_SIZE = 1080;
const BG_COLOR = "#1b2833";
const TEXT_COLOR = "#f3e6c0";

function drawShareCard(
  ctx: CanvasRenderingContext2D,
  score: number,
  rank: number | null
): void {
  const w = CARD_SIZE;
  const h = CARD_SIZE;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // RUPSY KVÍZ at top
  ctx.font = "bold 72px sans-serif";
  ctx.fillText("RUPSY KVÍZ", w / 2, 280);

  // Big score
  ctx.font = "bold 160px sans-serif";
  ctx.fillText(`${score} BODOV`, w / 2, h / 2 + 40);

  // Rank below
  if (rank != null) {
    ctx.font = "bold 64px sans-serif";
    ctx.fillText(`#${rank} na Slovensku`, w / 2, h / 2 + 180);
  }

  // Bottom CTA
  ctx.font = "bold 48px sans-serif";
  ctx.fillText("rupsy.sk/kviz", w / 2, h - 200);
}

export function generateShareImage(
  score: number,
  rank: number | null
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = CARD_SIZE;
    canvas.height = CARD_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas 2d unavailable"));
      return;
    }
    drawShareCard(ctx, score, rank);
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
  onToast?: (message: string) => void
): Promise<void> {
  const shareText = `Získal som ${score} bodov v RUPSY kvíze! 🏆 rupsy.sk/kviz`;
  const clipboardText =
    rank != null
      ? `Získal som ${score} bodov v RUPSY kvíze! 🏆 #${rank} na Slovensku — rupsy.sk/kviz`
      : shareText;

  try {
    const blob = await generateShareImage(score, rank);
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
