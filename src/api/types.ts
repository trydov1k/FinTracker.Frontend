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
