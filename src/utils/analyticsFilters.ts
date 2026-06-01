import type { AnalyticsFilter } from '../api/types';
import {
  countActiveFilters,
  createDefaultFilters,
  type TransactionFiltersState,
} from './transactionFilters';
import { dateInputToUtcEndIso, dateInputToUtcIso } from './date';

export interface AnalyticsFiltersState extends TransactionFiltersState {
  excludeTransfers: boolean;
  excludeCompensations: boolean;
}

export function createDefaultAnalyticsFilters(): AnalyticsFiltersState {
  return {
    ...createDefaultFilters(),
    excludeTransfers: true,
    excludeCompensations: false,
  };
}

export function countActiveAnalyticsFilters(filters: AnalyticsFiltersState): number {
  const defaults = createDefaultAnalyticsFilters();
  let count = countActiveFilters(filters);
  if (filters.excludeTransfers !== defaults.excludeTransfers) count++;
  if (filters.excludeCompensations !== defaults.excludeCompensations) count++;
  return count;
}

function parseAmount(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function analyticsFiltersToApiQuery(
  filters: AnalyticsFiltersState,
  options?: { expensesOnly?: boolean },
): AnalyticsFilter {
  const type =
    options?.expensesOnly && !filters.type
      ? 'Expense'
      : (filters.type || undefined);

  return {
    dateFrom: dateInputToUtcIso(filters.dateFrom),
    dateTo: dateInputToUtcEndIso(filters.dateTo),
    amountMin: parseAmount(filters.amountMin),
    amountMax: parseAmount(filters.amountMax),
    categoryId: filters.categoryId || undefined,
    scopeId: filters.excludeScopes ? undefined : filters.scopeId || undefined,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    type,
    excludeTransfers: filters.excludeTransfers,
    excludeCompensations: filters.excludeCompensations,
  };
}
