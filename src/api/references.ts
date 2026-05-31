import { apiFetch } from './client';
import type { CategoryDto, ScopeDto, TagDto } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5009';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function readString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return undefined;
}

function normalizeNamedEntity(raw: unknown): CategoryDto {
  const obj = asRecord(raw) ?? {};
  return {
    id: readString(obj, 'id', 'Id') ?? '',
    name: readString(obj, 'name', 'Name') ?? '',
  };
}

async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });

  if (!response.ok && response.status !== 204) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `HTTP ${response.status}`);
  }
}

export async function createCategory(name: string): Promise<CategoryDto> {
  const raw = await apiFetch<unknown>('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return normalizeNamedEntity(raw);
}

export async function updateCategory(id: string, name: string): Promise<CategoryDto> {
  const raw = await apiFetch<unknown>(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return normalizeNamedEntity(raw);
}

export async function deleteCategory(id: string): Promise<void> {
  await apiDelete(`/api/categories/${id}`);
}

export async function createScope(name: string): Promise<ScopeDto> {
  const raw = await apiFetch<unknown>('/api/scopes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return normalizeNamedEntity(raw);
}

export async function updateScope(id: string, name: string): Promise<ScopeDto> {
  const raw = await apiFetch<unknown>(`/api/scopes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return normalizeNamedEntity(raw);
}

export async function deleteScope(id: string): Promise<void> {
  await apiDelete(`/api/scopes/${id}`);
}

export async function createTag(name: string): Promise<TagDto> {
  const raw = await apiFetch<unknown>('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return normalizeNamedEntity(raw);
}

export async function deleteTag(id: string): Promise<void> {
  await apiDelete(`/api/tags/${id}`);
}
