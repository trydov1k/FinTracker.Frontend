import type { CategoryDto, ScopeDto, TagDto, TransactionDto } from './types';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function readString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }
  return undefined;
}

function normalizeCategory(raw: unknown): CategoryDto | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;

  const id = readString(obj, 'id', 'Id');
  const name = readString(obj, 'name', 'Name');
  if (!id || !name) return undefined;

  return { id, name };
}

function normalizeScope(raw: unknown): ScopeDto | undefined {
  const obj = asRecord(raw);
  if (!obj) return undefined;

  const id = readString(obj, 'id', 'Id');
  const name = readString(obj, 'name', 'Name');
  if (!id || !name) return undefined;

  return { id, name };
}

function normalizeTags(raw: unknown): TagDto[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const obj = asRecord(item);
      if (!obj) return null;

      const id = readString(obj, 'id', 'Id');
      const name = readString(obj, 'name', 'Name');
      if (!id || !name) return null;

      return { id, name };
    })
    .filter((tag): tag is TagDto => tag !== null);
}

export function normalizeTransactionDto(raw: unknown): TransactionDto {
  const obj = asRecord(raw) ?? {};

  const category =
    normalizeCategory(obj.category ?? obj.Category) ?? { id: '', name: '—' };

  return {
    id: readString(obj, 'id', 'Id') ?? '',
    amount: Number(obj.amount ?? obj.Amount ?? 0),
    currency: readString(obj, 'currency', 'Currency') ?? 'RUB',
    dateUtc: readString(obj, 'dateUtc', 'DateUtc') ?? new Date().toISOString(),
    description: readString(obj, 'description', 'Description'),
    comment: readString(obj, 'comment', 'Comment'),
    type: readString(obj, 'type', 'Type') ?? '',
    isDeleted: Boolean(obj.isDeleted ?? obj.IsDeleted ?? false),
    category,
    scope: normalizeScope(obj.scope ?? obj.Scope),
    tags: normalizeTags(obj.tags ?? obj.Tags),
  };
}

export function enrichTransactionDto(
  transaction: TransactionDto,
  refs: {
    categoryId: string;
    scopeId?: string;
    tagIds: string[];
    categories: CategoryDto[];
    scopes: ScopeDto[];
    tags: TagDto[];
  },
): TransactionDto {
  const category =
    transaction.category.id
      ? transaction.category
      : refs.categories.find((c) => c.id === refs.categoryId) ?? transaction.category;

  const scope =
    transaction.scope ??
    (refs.scopeId
      ? refs.scopes.find((s) => s.id === refs.scopeId)
      : undefined);

  const tags =
    transaction.tags.length > 0
      ? transaction.tags
      : refs.tags.filter((t) => refs.tagIds.includes(t.id));

  return { ...transaction, category, scope, tags };
}
