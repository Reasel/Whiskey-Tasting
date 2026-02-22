/**
 * Mock data for development
 */

import { ThemeScoresResponse } from './index';

export const mockThemeScores: ThemeScoresResponse[] = [
  {
    theme: {
      id: 1,
      name: 'Kentucky Bourbon Showdown',
      notes:
        "A selection of premium Kentucky bourbons.\nFeaturing both established names and craft distilleries.\nLet's explore the heart of bourbon country!",
      created_at: new Date().toISOString(),
    },
    whiskeys: [
      {
        whiskey_id: 1,
        whiskey_name: 'Buffalo Trace',
        proof: 90,
        scores: [
          {
            user_name: 'Alice',
            aroma_score: 8.5,
            flavor_score: 9.0,
            finish_score: 8.0,
            average_score: 8.5,
            personal_rank: 2,
          },
          {
            user_name: 'Bob',
            aroma_score: 7.5,
            flavor_score: 8.0,
            finish_score: 8.5,
            average_score: 8.0,
            personal_rank: 3,
          },
        ],
        average_score: 8.25,
        rank_by_average: 2,
      },
      {
        whiskey_id: 2,
        whiskey_name: "Maker's Mark",
        proof: 90,
        scores: [
          {
            user_name: 'Alice',
            aroma_score: 9.0,
            flavor_score: 9.5,
            finish_score: 9.0,
            average_score: 9.2,
            personal_rank: 1,
          },
          {
            user_name: 'Bob',
            aroma_score: 8.5,
            flavor_score: 9.0,
            finish_score: 9.0,
            average_score: 8.8,
            personal_rank: 1,
          },
        ],
        average_score: 9.0,
        rank_by_average: 1,
      },
    ],
  },
  {
    theme: {
      id: 2,
      name: 'World Whiskey Tour',
      notes:
        'A global journey through distinctive whiskeys.\nFeaturing spirits from Scotland, Japan, and Ireland.\nExplore different traditions and styles!',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    whiskeys: [
      {
        whiskey_id: 3,
        whiskey_name: 'Yamazaki 12',
        proof: 86,
        scores: [
          {
            user_name: 'Alice',
            aroma_score: 9.5,
            flavor_score: 9.0,
            finish_score: 9.5,
            average_score: 9.3,
            personal_rank: 1,
          },
        ],
        average_score: 9.3,
        rank_by_average: 1,
      },
      {
        whiskey_id: 4,
        whiskey_name: 'Redbreast 12',
        proof: 80,
        scores: [
          {
            user_name: 'Alice',
            aroma_score: 8.0,
            flavor_score: 8.5,
            finish_score: 8.0,
            average_score: 8.2,
            personal_rank: 2,
          },
        ],
        average_score: 8.2,
        rank_by_average: 2,
      },
    ],
  },
];
