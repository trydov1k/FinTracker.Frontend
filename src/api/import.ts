import { apiFetch } from './client';
import type {
  FileImportResultDto,
  MergedImportPreview,
  TransactionPreviewDto,
} from './types';

export async function uploadImportFiles(
  files: File[],
): Promise<FileImportResultDto[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  return apiFetch<FileImportResultDto[]>('/api/import', {
    method: 'POST',
    body: formData,
  });
}

export function mergeImportResults(
  fileResults: FileImportResultDto[],
): MergedImportPreview {
  const successful = fileResults.filter((r) => r.success && r.result);

  let imported = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let minDate: Date | undefined;
  let maxDate: Date | undefined;
  const categoryMap = new Map<string, number>();
  const preview: TransactionPreviewDto[] = [];

  for (const { result } of successful) {
    if (!result) continue;

    imported += result.imported;
    incomeCount += result.incomeCount;
    expenseCount += result.expenseCount;

    if (result.period) {
      const from = new Date(result.period.from);
      const to = new Date(result.period.to);
      if (!minDate || from < minDate) minDate = from;
      if (!maxDate || to > maxDate) maxDate = to;
    }

    for (const cat of result.categories) {
      categoryMap.set(cat.name, (categoryMap.get(cat.name) ?? 0) + cat.count);
    }

    preview.push(...result.preview);
  }

  const categories = [...categoryMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    period: minDate && maxDate ? { from: minDate, to: maxDate } : undefined,
    imported,
    incomeCount,
    expenseCount,
    categories,
    preview,
    fileResults,
  };
}
