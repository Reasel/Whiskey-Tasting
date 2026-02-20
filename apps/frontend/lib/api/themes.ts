/**
 * Theme management API functions
 */
import { apiFetch, apiPost, apiPut, apiDelete, API_URL } from './client';
import { mockThemeScores } from './mock-data';

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
  // Use mock data in development when running on localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return new Promise((resolve) => {
      resolve({ themes: mockThemeScores.map((ts) => ts.theme) });
    });
  }

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

export const updateTheme = async (
  themeId: number,
  request: { name?: string; notes?: string }
): Promise<Theme> => {
  const response = await apiPut(`/themes/${themeId}`, request);
  if (!response.ok) {
    throw new Error(`Failed to update theme: ${response.statusText}`);
  }
  return response.json();
};

export const updateWhiskeys = async (
  themeId: number,
  whiskeys: { name: string; proof: number | null }[]
): Promise<{ message: string }> => {
  const response = await apiPut(`/themes/${themeId}/whiskeys`, { whiskeys });
  if (!response.ok) {
    throw new Error(`Failed to update whiskeys: ${response.statusText}`);
  }
  return response.json();
};

export const deleteTheme = async (themeId: number): Promise<{ message: string }> => {
  const response = await apiDelete(`/themes/${themeId}`);
  if (!response.ok) {
    throw new Error(`Failed to delete theme: ${response.statusText}`);
  }
  return response.json();
};
