export function dateInputToUtcIso(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();
}

export function dateInputToUtcEndIso(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayDateInputValue(): string {
  return toDateInputValue(new Date());
}

export function utcIsoToDateInputValue(iso: string): string {
  const d = new Date(iso);
  return toDateInputValue(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toDateInputValue(from), to: toDateInputValue(to) };
}
