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

/**
 * "Closest to the group." For each whiskey, the group per-dimension average
 * is the mean of aroma/flavor/finish across that whiskey's scores[]. For
 * each taster, meanAbsDeviation is the mean over every
 * whiskey × {aroma, flavor, finish} they DID score of
 * |tasterScore - groupAvg|. Whiskeys a taster did not score are skipped so
 * partial participation is not penalized. Sorted ascending; rank 1 = lowest
 * deviation. A stable sort keeps original taster order on ties.
 */
export function consensus(theme: ThemeScoresResponse): ConsensusEntry[] {
  // Per-whiskey group dimension averages.
  const groupAvgs = new Map<
    number,
    { aroma: number; flavor: number; finish: number }
  >();
  for (const w of theme.whiskeys) {
    if (w.scores.length === 0) continue;
    groupAvgs.set(w.whiskey_id, {
      aroma: mean(w.scores.map((s) => s.aroma_score)),
      flavor: mean(w.scores.map((s) => s.flavor_score)),
      finish: mean(w.scores.map((s) => s.finish_score)),
    });
  }

  // Accumulate absolute deviations per taster, in first-seen order.
  const order: string[] = [];
  const sums = new Map<string, { sum: number; count: number }>();
  for (const w of theme.whiskeys) {
    const g = groupAvgs.get(w.whiskey_id);
    if (!g) continue;
    for (const s of w.scores) {
      if (!sums.has(s.user_name)) {
        sums.set(s.user_name, { sum: 0, count: 0 });
        order.push(s.user_name);
      }
      const acc = sums.get(s.user_name)!;
      acc.sum +=
        Math.abs(s.aroma_score - g.aroma) +
        Math.abs(s.flavor_score - g.flavor) +
        Math.abs(s.finish_score - g.finish);
      acc.count += 3;
    }
  }

  const entries: ConsensusEntry[] = order.map((user_name) => {
    const acc = sums.get(user_name)!;
    return {
      user_name,
      meanAbsDeviation: acc.count ? acc.sum / acc.count : 0,
      rank: 0,
    };
  });
  entries.sort((a, b) => a.meanAbsDeviation - b.meanAbsDeviation);
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });
  return entries;
}

/**
 * Flatten every theme's scored whiskeys into rows for the All Whiskeys
 * table. Whiskeys with no scores are excluded.
 */
export function allWhiskeys(all: ThemeScoresResponse[]): AllWhiskeyRow[] {
  const rows: AllWhiskeyRow[] = [];
  for (const theme of all) {
    for (const w of theme.whiskeys) {
      if (w.scores.length === 0) continue;
      rows.push({
        whiskey_name: w.whiskey_name,
        theme_name: theme.theme.name,
        proof: w.proof,
        score: mean(w.scores.map((s) => s.average_score)),
        tasters: w.scores.length,
      });
    }
  }
  return rows;
}
