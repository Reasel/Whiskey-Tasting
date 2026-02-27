import { apiFetch } from './client';

export interface DatabaseStats {
  total_themes: number;
  total_whiskeys: number;
  total_tastings: number;
  total_users: number;
  has_active_theme: boolean;
}

export interface SystemStatus {
  status: 'ready' | 'setup_required';
  database_stats: DatabaseStats;
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await apiFetch('/status');
  if (!res.ok) {
    throw new Error(`Failed to fetch system status (status ${res.status}).`);
  }
  return res.json();
}
