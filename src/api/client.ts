import type { ApiResponse } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5009';

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }

  return body.data;
}
