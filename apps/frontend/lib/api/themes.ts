/**
 * Theme management API functions
 */

import { apiFetch, apiPost } from './client';

// Types
export interface Theme {
  id: number;
  name: string;
  notes: string;
  created_at: string;
}

export interface ThemeListResponse {
  themes: Theme[];
}

export interface CreateThemeRequest {
  name: string;
  notes: string;
  num_whiskeys: number;
}

export interface ThemeCreateResponse {
  message: string;
  theme: Theme;
}

// API Functions
export const fetchThemes = async (): Promise<ThemeListResponse> => {
  const response = await apiFetch('/themes');
  if (!response.ok) {
    throw new Error(`Failed to fetch themes: ${response.statusText}`);
  }
  return response.json();
};

export const createTheme = async (request: CreateThemeRequest): Promise<ThemeCreateResponse> => {
  const response = await apiPost('/themes', request);
  if (!response.ok) {
    throw new Error(`Failed to create theme: ${response.statusText}`);
  }
  return response.json();
};