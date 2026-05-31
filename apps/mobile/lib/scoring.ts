import type {
  ThemeScoresResponse,
  WhiskeyScores,
  TastingScore,
} from './api/tastings';

export type RankedWhiskey = {
  whiskey_id: number;
  whiskey_name: string;
  proof: number | null;
  score: number;
  tasters: number;
  rank: number;
  scored: boolean;
};

export type ConsensusEntry = {
  user_name: string;
  meanAbsDeviation: number;
  rank: number;
};

export type AllWhiskeyRow = {
  whiskey_name: string;
  theme_name: string;
  proof: number | null;
  score: number;
  tasters: number;
};

export type PersonWhiskeyRow = {
  whiskey_name: string;
  proof: number | null;
  aroma: number;
  flavor: number;
  finish: number;
  average: number;
  rank: number;
};

export type PersonGroup = {
  user_name: string;
  rows: PersonWhiskeyRow[];
};

export type TasterRow = {
  user_name: string;
  aroma: number;
  flavor: number;
  finish: number;
  average: number;
  rank: number;
};

const mean = (xs: number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/**
 * Whiskeys sorted by average_score desc. Rank is derived locally (never
 * trust rank_by_average). Unscored whiskeys (no tasters) are marked
 * scored=false and, because their computed score is 0, sort last.
 */
export function leaderboard(theme: ThemeScoresResponse): RankedWhiskey[] {
  const rows: RankedWhiskey[] = theme.whiskeys.map((w) => {
    const tasters = w.scores.length;
    const score = tasters ? mean(w.scores.map((s) => s.average_score)) : 0;
    return {
      whiskey_id: w.whiskey_id,
      whiskey_name: w.whiskey_name,
      proof: w.proof,
      score,
      tasters,
      rank: 0,
      scored: tasters > 0,
    };
  });
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });
  return rows;
}
