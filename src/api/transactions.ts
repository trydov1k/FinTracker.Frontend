import { apiFetch } from './client';
import { enrichTransactionDto, normalizeTransactionDto } from './normalize';
import type { CategoryDto, CreateTransactionDto, ScopeDto, TagDto, TransactionDto } from './types';

export function getCategories(): Promise<CategoryDto[]> {
  return apiFetch<CategoryDto[]>('/api/categories');
}

export function getTags(): Promise<TagDto[]> {
  return apiFetch<TagDto[]>('/api/tags');
}

export function getScopes(): Promise<ScopeDto[]> {
  return apiFetch<ScopeDto[]>('/api/scopes');
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
