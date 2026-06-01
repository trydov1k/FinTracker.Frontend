import { apiFetch } from './client';
import type {
  AnalyticsFilter,
  AnalyticsSummaryDto,
  CategoryStatDto,
  ScopeStatDto,
  TagStatDto,
  TimeGrouping,
  TimeStatDto,
} from './types';

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

function readNumber(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
  }
  return 0;
}

function normalizeNamedEntity(raw: unknown): { id: string; name: string } {
  const obj = asRecord(raw) ?? {};
  return {
    id: readString(obj, 'id', 'Id') ?? '',
    name: readString(obj, 'name', 'Name') ?? '',
  };
}

function buildQueryString(filter: AnalyticsFilter, grouping?: TimeGrouping): string {
  const params = new URLSearchParams();

  if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
  if (filter.dateTo) params.set('dateTo', filter.dateTo);
  if (filter.amountMin != null) params.set('amountMin', String(filter.amountMin));
  if (filter.amountMax != null) params.set('amountMax', String(filter.amountMax));
  if (filter.categoryId) params.set('categoryId', filter.categoryId);
  if (filter.type) params.set('type', filter.type);
  if (filter.scopeId) params.set('scopeId', filter.scopeId);
  if (filter.excludeTransfers === false) params.set('excludeTransfers', 'false');
  if (filter.excludeCompensations) params.set('excludeCompensations', 'true');
  if (filter.tagIds?.length) {
    for (const id of filter.tagIds) {
      params.append('tagIds', id);
    }
  }
  if (filter.excludeScopeIds?.length) {
    for (const id of filter.excludeScopeIds) {
      params.append('excludeScopeIds', id);
    }
  }
  if (grouping) params.set('grouping', grouping);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function normalizeSummary(raw: unknown): AnalyticsSummaryDto {
  const obj = asRecord(raw) ?? {};
  return {
    totalIncome: readNumber(obj, 'totalIncome', 'TotalIncome'),
    totalExpense: readNumber(obj, 'totalExpense', 'TotalExpense'),
    balance: readNumber(obj, 'balance', 'Balance'),
  };
}

function normalizeCategoryStat(raw: unknown): CategoryStatDto {
  const obj = asRecord(raw) ?? {};
  const categoryRaw = obj.category ?? obj.Category;
  return {
    category: normalizeNamedEntity(categoryRaw),
    total: readNumber(obj, 'total', 'Total'),
    count: readNumber(obj, 'count', 'Count'),
    percent: readNumber(obj, 'percent', 'Percent'),
  };
}

function normalizeScopeStat(raw: unknown): ScopeStatDto {
  const obj = asRecord(raw) ?? {};
  const scopeRaw = obj.scope ?? obj.Scope;
  return {
    scope: normalizeNamedEntity(scopeRaw),
    total: readNumber(obj, 'total', 'Total'),
    count: readNumber(obj, 'count', 'Count'),
  };
}

function normalizeTagStat(raw: unknown): TagStatDto {
  const obj = asRecord(raw) ?? {};
  const tagRaw = obj.tag ?? obj.Tag;
  return {
    tag: normalizeNamedEntity(tagRaw),
    total: readNumber(obj, 'total', 'Total'),
    count: readNumber(obj, 'count', 'Count'),
  };
}

function normalizeTimeStat(raw: unknown): TimeStatDto {
  const obj = asRecord(raw) ?? {};
  return {
    period: readString(obj, 'period', 'Period') ?? '',
    totalIncome: readNumber(obj, 'totalIncome', 'TotalIncome'),
    totalExpense: readNumber(obj, 'totalExpense', 'TotalExpense'),
    balance: readNumber(obj, 'balance', 'Balance'),
  };
}

export async function getAnalyticsSummary(filter: AnalyticsFilter): Promise<AnalyticsSummaryDto> {
  const raw = await apiFetch<unknown>(`/api/analytics/summary${buildQueryString(filter)}`);
  return normalizeSummary(raw);
}

export async function getAnalyticsByCategory(filter: AnalyticsFilter): Promise<CategoryStatDto[]> {
  const raw = await apiFetch<unknown[]>(`/api/analytics/by-category${buildQueryString(filter)}`);
  return raw.map(normalizeCategoryStat);
}

export async function getAnalyticsByScope(filter: AnalyticsFilter): Promise<ScopeStatDto[]> {
  const raw = await apiFetch<unknown[]>(`/api/analytics/by-scope${buildQueryString(filter)}`);
  return raw.map(normalizeScopeStat);
}

export async function getAnalyticsByTag(filter: AnalyticsFilter): Promise<TagStatDto[]> {
  const raw = await apiFetch<unknown[]>(`/api/analytics/by-tag${buildQueryString(filter)}`);
  return raw.map(normalizeTagStat);
}

export async function getAnalyticsByTime(
  filter: AnalyticsFilter,
  grouping: TimeGrouping,
): Promise<TimeStatDto[]> {
  const raw = await apiFetch<unknown[]>(
    `/api/analytics/by-time${buildQueryString(filter, grouping)}`,
  );
  return raw.map(normalizeTimeStat);
}
