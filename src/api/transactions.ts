import { apiFetch } from './client';
import { enrichTransactionDto, normalizeTransactionDto } from './normalize';
import type {
  BulkUpdateDto,
  CategoryDto,
  CreateTransactionDto,
  ScopeDto,
  TagDto,
  TransactionDto,
  TransactionFilter,
  UpdateTransactionDto,
} from './types';

function buildQueryString(filter: TransactionFilter): string {
  const params = new URLSearchParams();

  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  if (filter.amountMin != null) params.set('amountMin', String(filter.amountMin));
  if (filter.amountMax != null) params.set('amountMax', String(filter.amountMax));
  if (filter.categoryId) params.set('categoryId', filter.categoryId);
  if (filter.type) params.set('type', filter.type);
  if (filter.scopeId) params.set('scopeId', filter.scopeId);
  if (filter.search) params.set('search', filter.search);
  if (filter.excludeScopes) params.set('excludeScopes', 'true');
  if (filter.tagIds?.length) {
    for (const id of filter.tagIds) {
      params.append('tagIds', id);
    }
  }
  if (filter.page) params.set('page', String(filter.page));
  if (filter.pageSize) params.set('pageSize', String(filter.pageSize));

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function getCategories(): Promise<CategoryDto[]> {
  return apiFetch<CategoryDto[]>('/api/categories');
}

export function getTags(): Promise<TagDto[]> {
  return apiFetch<TagDto[]>('/api/tags');
}

export function getScopes(): Promise<ScopeDto[]> {
  return apiFetch<ScopeDto[]>('/api/scopes');
}

export async function getTransactions(filter: TransactionFilter): Promise<TransactionDto[]> {
  const raw = await apiFetch<unknown[]>(`/api/transactions${buildQueryString(filter)}`);
  return raw.map(normalizeTransactionDto);
}

export async function deleteTransaction(id: string): Promise<void> {
  const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5009';
  const response = await fetch(`${API_BASE}/api/transactions/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `HTTP ${response.status}`);
  }
}

export async function bulkUpdateTransactions(dto: BulkUpdateDto): Promise<void> {
  const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5009';
  const response = await fetch(`${API_BASE}/api/transactions/bulk`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `HTTP ${response.status}`);
  }
}

export async function updateTransaction(
  id: string,
  dto: UpdateTransactionDto,
  refs?: {
    categoryId?: string;
    scopeId?: string;
    tagIds?: string[];
    categories: CategoryDto[];
    scopes: ScopeDto[];
    tags: TagDto[];
  },
): Promise<TransactionDto> {
  const raw = await apiFetch<unknown>(`/api/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  const transaction = normalizeTransactionDto(raw);

  if (refs?.categoryId) {
    return enrichTransactionDto(transaction, {
      categoryId: refs.categoryId,
      scopeId: refs.scopeId,
      tagIds: refs.tagIds ?? transaction.tags.map((t) => t.id),
      categories: refs.categories,
      scopes: refs.scopes,
      tags: refs.tags,
    });
  }

  return transaction;
}

export async function createTransaction(
  dto: CreateTransactionDto,
  refs?: {
    categoryId: string;
    scopeId?: string;
    tagIds: string[];
    categories: CategoryDto[];
    scopes: ScopeDto[];
    tags: TagDto[];
  },
): Promise<TransactionDto> {
  const raw = await apiFetch<unknown>('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  const transaction = normalizeTransactionDto(raw);

  if (refs) {
    return enrichTransactionDto(transaction, refs);
  }

  return transaction;
}
