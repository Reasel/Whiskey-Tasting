/**
 * Tasting API operations
 */

import { apiFetch, apiPost } from './client';

// Types based on backend models
export interface ThemeScoresResponse {
  theme: {
    id: number;
    name: string;
    notes: string;
    created_at: string;
  };
  whiskeys: {
    whiskey_id: number;
    whiskey_name: string;
    proof: number | null;
    scores: {
      user_name: string;
      aroma_score: number;
      flavor_score: number;
      finish_score: number;
      average_score: number;
      personal_rank: number;
    }[];
    average_score: number;
    rank_by_average: number;
  }[];
}

export interface SubmitTastingRequest {
  user_name: string;
  whiskey_scores: Record<number, {
    aroma_score: number;
    flavor_score: number;
    finish_score: number;
    personal_rank: number;
  }>;
}

export interface Whiskey {
  id: number | null;
  theme_id: number;
  name: string;
  proof: number | null;
  created_at: string | null;
}

export interface ThemeResponse {
  id: number;
  name: string;
  notes: string;
  created_at: string;
}

/**
 * Fetch all themes with their scores
 */
export async function fetchAllThemesScores(): Promise<ThemeScoresResponse[]> {
  const response = await apiFetch('/tastings/themes/scores');
  if (!response.ok) {
    throw new Error(`Failed to fetch themes scores: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Submit tasting scores
 */
export async function submitTasting(request: SubmitTastingRequest): Promise<{ message: string }> {
  const response = await apiPost('/tastings', request);
  if (!response.ok) {
    throw new Error(`Failed to submit tasting: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch active theme
 */
export async function fetchActiveTheme(): Promise<ThemeResponse | null> {
  const response = await apiFetch('/themes/active');
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch active theme: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch whiskeys for a theme
 */
export async function fetchWhiskeysByTheme(themeId: number): Promise<Whiskey[]> {
  const response = await apiFetch(`/themes/${themeId}/whiskeys`);
  if (!response.ok) {
    throw new Error(`Failed to fetch whiskeys: ${response.statusText}`);
  }
  return response.json();
}

// Types for user tastings
export interface UserTastingsResponse {
  user_name: string;
  theme: ThemeResponse;
  tastings: Record<number, {
    aroma_score: number;
    flavor_score: number;
    finish_score: number;
    personal_rank: number;
  }>;
}

/**
 * Fetch user's tastings for a theme
 */
export async function fetchUserTastingsForTheme(userName: string, themeId: number): Promise<UserTastingsResponse> {
  const response = await apiFetch(`/tastings/users/${encodeURIComponent(userName)}/themes/${themeId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user tastings: ${response.statusText}`);
  }
  return response.json();
}