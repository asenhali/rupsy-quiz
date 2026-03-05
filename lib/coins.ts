export const PARTICIPATION_COINS = 5;
export const COINS_PER_CORRECT = 1;

function getRankCoinBonus(rank: number): number {
  if (rank === 1) return 50;
  if (rank === 2) return 40;
  if (rank === 3) return 35;
  if (rank >= 4 && rank <= 10) return 25;
  if (rank >= 11 && rank <= 25) return 15;
  if (rank >= 26 && rank <= 50) return 10;
  return 5;
}

export function calculateQuizCoins(
  totalCorrect: number,
  rank: number
): {
  participationCoins: number;
  correctCoins: number;
  rankCoins: number;
  totalCoins: number;
} {
  const participationCoins = PARTICIPATION_COINS;
  const correctCoins = totalCorrect * COINS_PER_CORRECT;
  const rankCoins = getRankCoinBonus(rank);
  return {
    participationCoins,
    correctCoins,
    rankCoins,
    totalCoins: participationCoins + correctCoins + rankCoins,
  };
}
