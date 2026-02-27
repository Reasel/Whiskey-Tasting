import { getServerUrl } from '../storage';

let cachedBaseUrl: string | null = null;

export async function getApiBase(): Promise<string> {
  if (!cachedBaseUrl) {
    const serverUrl = await getServerUrl();
    cachedBaseUrl = `${serverUrl}/api/v1`;
  }
  return cachedBaseUrl;
}

export function clearApiCache(): void {
  cachedBaseUrl = null;
}

export async function apiFetch(
  endpoint: string,
  options?: RequestInit,
): Promise<Response> {
  const base = await getApiBase();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;
  return fetch(url, options);
}

export async function apiPost<T>(
  endpoint: string,
  body: T,
): Promise<Response> {
  return apiFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(
  endpoint: string,
  body: T,
): Promise<Response> {
  return apiFetch(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function apiDelete(endpoint: string): Promise<Response> {
  return apiFetch(endpoint, { method: 'DELETE' });
}
