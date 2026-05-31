export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDatePeriod(from: Date, to: Date): string {
  return `${formatDateShort(from)} – ${formatDateShort(to)}`;
}

export function formatDateInputPeriod(from: string, to: string): string {
  const [fy, fm, fd] = from.split('-');
  const [ty, tm, td] = to.split('-');
  return `${fd}.${fm}.${fy} – ${td}.${tm}.${ty}`;
}

export function currencySymbol(code: string): string {
  switch (code) {
    case 'RUB':
      return '₽';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    default:
      return code;
  }
}

export function formatAmount(amount: number, currency = '₽'): string {
  const sign = amount >= 0 ? '+' : '−';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${sign}${formatted} ${currency}`;
}
