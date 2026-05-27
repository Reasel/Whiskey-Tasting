import { apiFetch, apiPost } from './client';

export interface TastingScore {
  user_name: string;
  aroma_score: number;
  flavor_score: number;
  finish_score: number;
  average_score: number;
  personal_rank: number;
}

export interface WhiskeyScores {
  whiskey_id: number;
  whiskey_name: string;
  proof: number | null;
  scores: TastingScore[];
  average_score: number;
  rank_by_average: number;
}

export interface ThemeScoresResponse {
  theme: {
    id: number;
    name: string;
    notes: string;
    created_at: string;
  };
  whiskeys: WhiskeyScores[];
}

export interface Whiskey {
  id: number | null;
  theme_id: number;
  name: string;
  proof: number | null;
  created_at: string | null;
}

export interface SubmitTastingRequest {
  user_name: string;
  whiskey_scores: Record<
    number,
    {
      aroma_score: number;
      flavor_score: number;
      finish_score: number;
      personal_rank: number;
    }
  >;
}

export interface UserTastingsResponse {
  user_name: string;
  theme: {
    id: number;
    name: string;
    notes: string;
    created_at: string;
  };
  tastings: Record<
    number,
    {
      aroma_score: number;
      flavor_score: number;
      finish_score: number;
      personal_rank: number;
    }
  >;
}

export async function fetchAllThemesScores(): Promise<ThemeScoresResponse[]> {
  const response = await apiFetch('/tastings/themes/scores');
  if (!response.ok) {
    throw new Error(`Failed to fetch themes scores: ${response.statusText}`);
  }
  return response.json();
}

export async function submitTasting(
  request: SubmitTastingRequest,
): Promise<{ message: string }> {
  const response = await apiPost('/tastings', request);
  if (!response.ok) {
    throw new Error(`Failed to submit tasting: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchWhiskeysByTheme(
  themeId: number,
): Promise<Whiskey[]> {
  const response = await apiFetch(`/themes/${themeId}/whiskeys`);
  if (!response.ok) {
    throw new Error(`Failed to fetch whiskeys: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchUserTastingsForTheme(
  userName: string,
  themeId: number,
): Promise<UserTastingsResponse> {
  const response = await apiFetch(
    `/tastings/users/${encodeURIComponent(userName)}/themes/${themeId}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch user tastings: ${response.statusText}`);
  }
  return response.json();
}
