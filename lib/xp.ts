export const PARTICIPATION_XP = 30;
export const XP_PER_CORRECT = 20;

const RANK_BONUS: Record<number, number> = {
  1: 150,
  2: 120,
  3: 100,
};

function getRankBonus(rank: number): number {
  if (rank >= 1 && rank <= 3) return RANK_BONUS[rank];
  if (rank >= 4 && rank <= 10) return 80;
  if (rank >= 11 && rank <= 25) return 50;
  if (rank >= 26 && rank <= 50) return 30;
  return 15;
}

export function calculateQuizXP(
  totalCorrect: number,
  rank: number
): { participationXP: number; correctXP: number; rankXP: number; totalXP: number } {
  const participationXP = PARTICIPATION_XP;
  const correctXP = totalCorrect * XP_PER_CORRECT;
  const rankXP = getRankBonus(rank);
  return {
    participationXP,
    correctXP,
    rankXP,
    totalXP: participationXP + correctXP + rankXP,
  };
}

export const LEVEL_THRESHOLDS: number[] = [
  0, 100, 250, 500, 850, 1300, 1900, 2600, 3500, 4600, 5900, 7400, 9100, 11000, 13100, 15400, 17900, 20600, 23500, 26600, 29900, 33400, 37100, 41000, 45000,
];

const MAX_LEVEL = 25;

export function calculateLevel(totalXP: number): {
  level: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number | null;
  progressPercent: number;
} {
  const currentXP = Math.max(0, totalXP);
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (currentXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    }
  }
  level = Math.min(level, MAX_LEVEL);

  const xpForCurrentLevel = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const xpForNextLevel = level < MAX_LEVEL ? (LEVEL_THRESHOLDS[level] ?? null) : null;

  const progressPercent =
    xpForNextLevel != null
      ? Math.min(
          100,
          Math.max(0, ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100)
        )
      : 100;

  return {
    level,
    currentXP,
    xpForCurrentLevel,
    xpForNextLevel,
    progressPercent,
  };
}
