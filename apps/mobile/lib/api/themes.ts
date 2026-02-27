import { apiFetch, apiPost, apiPut, apiDelete } from './client';

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

export async function fetchThemes(): Promise<ThemeListResponse> {
  const response = await apiFetch('/themes');
  if (!response.ok) {
    throw new Error(`Failed to fetch themes: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchActiveTheme(): Promise<Theme | null> {
  const response = await apiFetch('/themes/active');
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch active theme: ${response.statusText}`);
  }
  return response.json();
}

export async function createTheme(
  request: CreateThemeRequest,
): Promise<ThemeCreateResponse> {
  const response = await apiPost('/themes', request);
  if (!response.ok) {
    throw new Error(`Failed to create theme: ${response.statusText}`);
  }
  return response.json();
}

export async function updateTheme(
  themeId: number,
  request: { name?: string; notes?: string },
): Promise<Theme> {
  const response = await apiPut(`/themes/${themeId}`, request);
  if (!response.ok) {
    throw new Error(`Failed to update theme: ${response.statusText}`);
  }
  return response.json();
}

export async function updateWhiskeys(
  themeId: number,
  whiskeys: { name: string; proof: number | null }[],
): Promise<{ message: string }> {
  const response = await apiPut(`/themes/${themeId}/whiskeys`, { whiskeys });
  if (!response.ok) {
    throw new Error(`Failed to update whiskeys: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteTheme(
  themeId: number,
): Promise<{ message: string }> {
  const response = await apiDelete(`/themes/${themeId}`);
  if (!response.ok) {
    throw new Error(`Failed to delete theme: ${response.statusText}`);
  }
  return response.json();
}
