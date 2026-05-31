import type { TransactionFilter, TransactionTypeFilter } from '../api/types';
import { dateInputToUtcEndIso, dateInputToUtcIso, getCurrentMonthRange } from './date';

export interface TransactionFiltersState {
  dateFrom: string;
  dateTo: string;
  search: string;
  categoryId: string;
  type: TransactionTypeFilter;
  scopeId: string;
  amountMin: string;
  amountMax: string;
  tagIds: string[];
  excludeScopes: boolean;
}

export function createDefaultFilters(): TransactionFiltersState {
  const range = getCurrentMonthRange();
  return {
    dateFrom: range.from,
    dateTo: range.to,
    search: '',
    categoryId: '',
    type: '',
    scopeId: '',
    amountMin: '',
    amountMax: '',
    tagIds: [],
    excludeScopes: false,
  };
}

export function countActiveFilters(filters: TransactionFiltersState): number {
  const defaults = createDefaultFilters();
  let count = 0;
  if (filters.dateFrom !== defaults.dateFrom || filters.dateTo !== defaults.dateTo) count++;
  if (filters.search.trim()) count++;
  if (filters.categoryId) count++;
  if (filters.type) count++;
  if (filters.scopeId) count++;
  if (filters.amountMin.trim() || filters.amountMax.trim()) count++;
  if (filters.tagIds.length > 0) count++;
  if (filters.excludeScopes) count++;
  return count;
}

function parseAmount(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function filtersToApiQuery(
  filters: TransactionFiltersState,
  search: string,
  page: number,
  pageSize: number,
): TransactionFilter {
  return {
    dateFrom: dateInputToUtcIso(filters.dateFrom),
    dateTo: dateInputToUtcEndIso(filters.dateTo),
    amountMin: parseAmount(filters.amountMin),
    amountMax: parseAmount(filters.amountMax),
    categoryId: filters.categoryId || undefined,
    type: (filters.type || undefined) as TransactionTypeFilter | undefined,
    scopeId: filters.excludeScopes ? undefined : filters.scopeId || undefined,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    search: search.trim() || undefined,
    excludeScopes: filters.excludeScopes || undefined,
    page,
    pageSize,
  };
}
