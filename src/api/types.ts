export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface DateRangeDto {
  from: string;
  to: string;
}

export interface CategoryImportStatDto {
  name: string;
  count: number;
}

export interface TransactionPreviewDto {
  dateUtc: string;
  description?: string;
  amount: number;
  category: string;
}

export interface ImportResultDto {
  total: number;
  imported: number;
  errors: { row: number; reason: string }[];
  categories: CategoryImportStatDto[];
  period?: DateRangeDto;
  incomeCount: number;
  expenseCount: number;
  preview: TransactionPreviewDto[];
}

export interface FileImportResultDto {
  fileName: string;
  success: boolean;
  error?: string;
  result?: ImportResultDto;
}

export interface MergedImportPreview {
  period?: { from: Date; to: Date };
  imported: number;
  incomeCount: number;
  expenseCount: number;
  categories: CategoryImportStatDto[];
  preview: TransactionPreviewDto[];
  fileResults: FileImportResultDto[];
}

export interface CategoryDto {
  id: string;
  name: string;
}

export interface TagDto {
  id: string;
  name: string;
}

export interface ScopeDto {
  id: string;
  name: string;
}

export interface CreateTransactionDto {
  amount: number;
  currency: string;
  dateUtc: string;
  description?: string;
  comment?: string;
  categoryId: string;
  scopeId?: string;
  tagIds: string[];
}

export interface UpdateTransactionDto {
  amount?: number;
  currency?: string;
  dateUtc?: string;
  description?: string;
  comment?: string;
  categoryId?: string;
  scopeId?: string;
  deleteScope?: boolean;
  tagIds?: string[];
}

export interface TransactionDto {
  id: string;
  amount: number;
  currency: string;
  dateUtc: string;
  description?: string;
  comment?: string;
  type: string;
  isDeleted: boolean;
  category: CategoryDto;
  scope?: ScopeDto;
  tags: TagDto[];
}

export type TransactionTypeFilter = '' | 'Expense' | 'Income';

export interface TransactionFilter {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  categoryId?: string;
  type?: TransactionTypeFilter;
  tagIds?: string[];
  scopeId?: string;
  search?: string;
  excludeScopes?: boolean;
  page?: number;
  pageSize?: number;
}

export interface BulkUpdateDto {
  transactionIds: string[];
  categoryId?: string;
  scopeId?: string;
  deleteScope?: boolean;
  comment?: string;
  addTagIds?: string[];
  replaceTagIds?: string[];
}

export type TimeGrouping = 'Day' | 'Week' | 'Month';

export interface AnalyticsFilter {
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  categoryId?: string;
  type?: TransactionTypeFilter;
  tagIds?: string[];
  scopeId?: string;
  excludeScopeIds?: string[];
  excludeTransfers?: boolean;
  excludeCompensations?: boolean;
}

export interface AnalyticsSummaryDto {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CategoryStatDto {
  category: CategoryDto;
  total: number;
  count: number;
  percent: number;
}

export interface ScopeStatDto {
  scope: ScopeDto;
  total: number;
  count: number;
}

export interface TagStatDto {
  tag: TagDto;
  total: number;
  count: number;
}

export interface TimeStatDto {
  period: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
