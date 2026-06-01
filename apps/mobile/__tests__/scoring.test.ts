import type {
  ThemeScoresResponse,
  WhiskeyScores,
  TastingScore,
} from '../lib/api/tastings';
import {
  leaderboard,
  consensus,
  allWhiskeys,
  byPerson,
  whiskeyBreakdown,
} from '../lib/scoring';

function score(
  user_name: string,
  a: number,
  f: number,
  fi: number,
  rank = 0,
): TastingScore {
  return {
    user_name,
    aroma_score: a,
    flavor_score: f,
    finish_score: fi,
    average_score: (a + f + fi) / 3,
    personal_rank: rank,
  };
}

function whiskey(
  whiskey_id: number,
  whiskey_name: string,
  proof: number | null,
  scores: TastingScore[],
): WhiskeyScores {
  const avg = scores.length
    ? scores.reduce((s, x) => s + x.average_score, 0) / scores.length
    : 0;
  return {
    whiskey_id,
    whiskey_name,
    proof,
    scores,
    average_score: avg,
    rank_by_average: 0, // intentionally buggy/zero — never trusted
  };
}

// 3 whiskeys, 4 tasters, deliberate participation gaps.
const theme: ThemeScoresResponse = {
  theme: { id: 7, name: 'Bourbon Night', notes: 'n', created_at: '2026-01-01' },
  whiskeys: [
    whiskey(1, 'Whiskey A', 90, [
      score('Ann', 5, 5, 5, 1),
      score('Bob', 4, 4, 4, 2),
      score('Cy', 3, 3, 3, 3),
    ]),
    whiskey(2, 'Whiskey B', 100, [
      score('Ann', 2, 2, 2, 3),
      score('Bob', 4, 4, 4, 1),
    ]),
    whiskey(3, 'Whiskey C', 80, [score('Dee', 1, 1, 1, 1)]),
  ],
};

// A theme whose whiskeys have NO scores (unscored edge case).
const emptyTheme: ThemeScoresResponse = {
  theme: { id: 8, name: 'Empty', notes: '', created_at: '2026-01-02' },
  whiskeys: [whiskey(10, 'No Scores', 95, [])],
};

describe('leaderboard', () => {
  it('ranks whiskeys by average_score desc, derived locally', () => {
    const lb = leaderboard(theme);
    expect(lb.map((r) => r.whiskey_name)).toEqual([
      'Whiskey A',
      'Whiskey B',
      'Whiskey C',
    ]);
    expect(lb.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(lb[0].score).toBeCloseTo(4.0, 5);
    expect(lb[1].score).toBeCloseTo(3.0, 5);
    expect(lb[2].score).toBeCloseTo(1.0, 5);
    expect(lb.map((r) => r.tasters)).toEqual([3, 2, 1]);
    expect(lb.every((r) => r.scored)).toBe(true);
  });

  it('marks unscored whiskeys scored=false and sorts them last', () => {
    const mixed: ThemeScoresResponse = {
      ...theme,
      whiskeys: [...theme.whiskeys, whiskey(99, 'Unscored', 70, [])],
    };
    const lb = leaderboard(mixed);
    const last = lb[lb.length - 1];
    expect(last.whiskey_name).toBe('Unscored');
    expect(last.scored).toBe(false);
    expect(last.tasters).toBe(0);
    expect(last.score).toBe(0);
  });
});

describe('consensus', () => {
  it('computes mean-abs-deviation per taster, skipping unscored whiskeys', () => {
    const c = consensus(theme);
    const byName = Object.fromEntries(c.map((e) => [e.user_name, e]));
    expect(byName['Ann'].meanAbsDeviation).toBeCloseTo(1.0, 5);
    expect(byName['Bob'].meanAbsDeviation).toBeCloseTo(0.5, 5);
    expect(byName['Cy'].meanAbsDeviation).toBeCloseTo(1.0, 5);
    expect(byName['Dee'].meanAbsDeviation).toBeCloseTo(0.0, 5);
  });

  it('sorts ascending (closest first) and ranks 1..N', () => {
    const c = consensus(theme);
    expect(c.map((e) => e.user_name)).toEqual(['Dee', 'Bob', 'Ann', 'Cy']);
    expect(c.map((e) => e.rank)).toEqual([1, 2, 3, 4]);
  });
});

describe('allWhiskeys', () => {
  it('flattens all themes, one row per scored whiskey, excludes unscored', () => {
    const rows = allWhiskeys([theme, emptyTheme]);
    expect(rows).toHaveLength(3); // emptyTheme's whiskey is excluded
    const a = rows.find((r) => r.whiskey_name === 'Whiskey A')!;
    expect(a.theme_name).toBe('Bourbon Night');
    expect(a.proof).toBe(90);
    expect(a.score).toBeCloseTo(4.0, 5);
    expect(a.tasters).toBe(3);
    expect(rows.some((r) => r.whiskey_name === 'No Scores')).toBe(false);
  });
});

describe('byPerson', () => {
  it('groups the active theme by taster with their own whiskey rows', () => {
    const groups = byPerson(theme);
    const names = groups.map((g) => g.user_name);
    expect(names).toContain('Ann');
    expect(names).toContain('Dee');

    const ann = groups.find((g) => g.user_name === 'Ann')!;
    expect(ann.rows.map((r) => r.whiskey_name)).toEqual([
      'Whiskey A',
      'Whiskey B',
    ]);
    const annA = ann.rows.find((r) => r.whiskey_name === 'Whiskey A')!;
    expect(annA.aroma).toBe(5);
    expect(annA.average).toBeCloseTo(5.0, 5);
    // Ann's personal leaderboard: A (5) ahead of B (2).
    expect(annA.rank).toBe(1);
    const annB = ann.rows.find((r) => r.whiskey_name === 'Whiskey B')!;
    expect(annB.rank).toBe(2);

    const dee = groups.find((g) => g.user_name === 'Dee')!;
    expect(dee.rows).toHaveLength(1);
    expect(dee.rows[0].whiskey_name).toBe('Whiskey C');
    expect(dee.rows[0].rank).toBe(1);
  });
});

describe('whiskeyBreakdown', () => {
  it('returns per-taster rows ranked by their average desc', () => {
    const w = theme.whiskeys[0]; // Whiskey A
    const rows = whiskeyBreakdown(w);
    expect(rows.map((r) => r.user_name)).toEqual(['Ann', 'Bob', 'Cy']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(rows[0].aroma).toBe(5);
    expect(rows[0].average).toBeCloseTo(5.0, 5);
    expect(rows[2].average).toBeCloseTo(3.0, 5);
  });

  it('handles a whiskey with no scores', () => {
    const w = emptyTheme.whiskeys[0];
    expect(whiskeyBreakdown(w)).toEqual([]);
  });
});
