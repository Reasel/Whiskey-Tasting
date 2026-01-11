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

// Fetch system status
export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await apiFetch('/status', { credentials: 'include' });

  if (!res.ok) {
    throw new Error(`Failed to fetch system status (status ${res.status}).`);
  }

  return res.json();
}

// Reset database
export async function resetDatabase(): Promise<void> {
  const res = await apiFetch('/config/reset-database', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm: 'RESET' }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to reset database (status ${res.status}).`);
  }
}
