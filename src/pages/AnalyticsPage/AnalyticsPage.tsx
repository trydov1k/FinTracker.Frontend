import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  getAnalyticsByCategory,
  getAnalyticsByScope,
  getAnalyticsByTag,
  getAnalyticsByTime,
  getAnalyticsSummary,
} from '../../api/analytics';
import { getCategories, getScopes, getTags } from '../../api/transactions';
import type {
  AnalyticsSummaryDto,
  CategoryStatDto,
  CategoryDto,
  ScopeDto,
  ScopeStatDto,
  TagDto,
  TagStatDto,
  TimeGrouping,
  TimeStatDto,
} from '../../api/types';
import { Tag } from '../../components/Tag/Tag';
import { categoryTagVariant } from '../../utils/categoryTag';
import {
  analyticsFiltersToApiQuery,
  countActiveAnalyticsFilters,
  createDefaultAnalyticsFilters,
  type AnalyticsFiltersState,
} from '../../utils/analyticsFilters';
import { formatDateInputPeriod, formatMoney, formatPercent } from '../../utils/format';
import { TransactionsFiltersPanel } from '../TransactionsPage/TransactionsFiltersPanel';
import './AnalyticsPage.css';
import '../TransactionsPage/TransactionsPage.css';

const TABLE_PREVIEW_ROWS = 8;

function formatTimePeriod(period: string, grouping: TimeGrouping): string {
  if (grouping === 'Day' && /^\d{4}-\d{2}-\d{2}$/.test(period)) {
    const [y, m, d] = period.split('-');
    return `${d}.${m}.${y}`;
  }
  if (grouping === 'Week' && /^\d{4}-W\d{2}$/.test(period)) {
    const [year, week] = period.split('-W');
    return `${year}, нед. ${week}`;
  }
  if (grouping === 'Month' && /^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    const label = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return period;
}

const TIME_GROUPING_OPTIONS: { value: TimeGrouping; label: string }[] = [
  { value: 'Day', label: 'День' },
  { value: 'Week', label: 'Неделя' },
  { value: 'Month', label: 'Месяц' },
];

export function AnalyticsPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [scopes, setScopes] = useState<ScopeDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);

  const [filters, setFilters] = useState<AnalyticsFiltersState>(createDefaultAnalyticsFilters);
  const [draftFilters, setDraftFilters] = useState<AnalyticsFiltersState>(createDefaultAnalyticsFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timeGrouping, setTimeGrouping] = useState<TimeGrouping>('Month');

  const [summary, setSummary] = useState<AnalyticsSummaryDto | null>(null);
  const [byCategory, setByCategory] = useState<CategoryStatDto[]>([]);
  const [byScope, setByScope] = useState<ScopeStatDto[]>([]);
  const [byTag, setByTag] = useState<TagStatDto[]>([]);
  const [byTime, setByTime] = useState<TimeStatDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = countActiveAnalyticsFilters(filters);

  const loadReferences = useCallback(async () => {
    const [cats, scopeList, tagList] = await Promise.all([
      getCategories(),
      getScopes(),
      getTags(),
    ]);
    setCategories(cats);
    setScopes(scopeList);
    setTags(tagList);
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    const summaryQuery = analyticsFiltersToApiQuery(filters);
    const expenseQuery = analyticsFiltersToApiQuery(filters, { expensesOnly: !filters.type });

    try {
      const [summaryData, categoryData, scopeData, tagData, timeData] = await Promise.all([
        getAnalyticsSummary(summaryQuery),
        getAnalyticsByCategory(expenseQuery),
        getAnalyticsByScope(expenseQuery),
        getAnalyticsByTag(expenseQuery),
        getAnalyticsByTime(expenseQuery, timeGrouping),
      ]);

      setSummary(summaryData);
      setByCategory(categoryData);
      setByScope(scopeData);
      setByTag(tagData);
      setByTime(timeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить аналитику');
      setSummary(null);
      setByCategory([]);
      setByScope([]);
      setByTag([]);
      setByTime([]);
    } finally {
      setLoading(false);
    }
  }, [filters, timeGrouping]);

  useEffect(() => {
    void loadReferences().catch(() => {
      /* справочники необязательны */
    });
  }, [loadReferences]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    if (!filtersOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filtersOpen]);

  const patchFilter = (partial: Partial<AnalyticsFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const toggleFilters = () => {
    setFiltersOpen((open) => {
      if (!open) setDraftFilters({ ...filters });
      return !open;
    });
  };

  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    const defaults = createDefaultAnalyticsFilters();
    setDraftFilters(defaults);
    setFilters(defaults);
    setFiltersOpen(false);
  };

  const periodLabel = formatDateInputPeriod(filters.dateFrom, filters.dateTo);

  return (
    <div className="analytics">
      <div className="analytics__card">
        <div className="analytics__toolbar">
          <div className="transactions__filters-section" ref={filtersRef}>
            <div className="transactions__filters-row">
              <div className="transactions__date-picker">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M2 6H14M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <input
                  type="date"
                  className="transactions__date-input"
                  value={filters.dateFrom}
                  onChange={(e) => patchFilter({ dateFrom: e.target.value })}
                  aria-label="Дата с"
                />
                <span className="transactions__date-sep">–</span>
                <input
                  type="date"
                  className="transactions__date-input"
                  value={filters.dateTo}
                  onChange={(e) => patchFilter({ dateTo: e.target.value })}
                  aria-label="Дата по"
                />
              </div>

              <div className="transactions__search">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  placeholder="Поиск по описанию, тегам, категориям..."
                  className="transactions__search-input"
                  value={filters.search}
                  onChange={(e) => patchFilter({ search: e.target.value })}
                  maxLength={50}
                />
              </div>

              <select
                className="transactions__select"
                value={filters.categoryId}
                onChange={(e) => patchFilter({ categoryId: e.target.value })}
              >
                <option value="">Все категории</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                className="transactions__select"
                value={filters.type}
                onChange={(e) => patchFilter({ type: e.target.value as AnalyticsFiltersState['type'] })}
              >
                <option value="">Все типы</option>
                <option value="Expense">Расходы</option>
                <option value="Income">Доходы</option>
              </select>

              <select
                className="transactions__select"
                value={filters.scopeId}
                onChange={(e) => patchFilter({ scopeId: e.target.value, excludeScopes: false })}
                disabled={filters.excludeScopes}
              >
                <option value="">Все группы</option>
                {scopes.map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    {scope.name}
                  </option>
                ))}
              </select>

              <div className="transactions__filters-trigger">
                <button
                  type="button"
                  className={`transactions__filter-btn${filtersOpen ? ' transactions__filter-btn--active' : ''}`}
                  onClick={toggleFilters}
                  aria-expanded={filtersOpen}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M2 4H14M4 8H12M6 12H10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Фильтры
                  {activeFilterCount > 0 && (
                    <span className="transactions__filter-badge">{activeFilterCount}</span>
                  )}
                </button>
              </div>
            </div>

            {filtersOpen && (
              <TransactionsFiltersPanel
                draft={draftFilters}
                categories={categories}
                scopes={scopes}
                tags={tags}
                onChange={(draft) => setDraftFilters(draft as AnalyticsFiltersState)}
                onApply={applyFilters}
                onReset={resetFilters}
                showExcludeScopes={false}
                showAnalyticsOptions
              />
            )}
          </div>
        </div>

        {error && (
          <div className="analytics__error" role="alert">
            {error}
          </div>
        )}

        <section className="analytics__summary" aria-label="Сводка за период">
          <SummaryCard
            label="Доходы"
            value={summary ? formatMoney(summary.totalIncome) : '—'}
            hint="За выбранный период"
            variant="income"
            loading={loading}
          />
          <SummaryCard
            label="Расходы"
            value={summary ? formatMoney(summary.totalExpense) : '—'}
            hint="За выбранный период"
            variant="expense"
            loading={loading}
          />
          <SummaryCard
            label="Баланс"
            value={summary ? formatMoney(summary.balance) : '—'}
            hint="За выбранный период"
            variant="balance"
            loading={loading}
            valueClass={
              summary
                ? summary.balance >= 0
                  ? 'analytics__summary-value--positive'
                  : 'analytics__summary-value--negative'
                : undefined
            }
          />
        </section>

        <div className="analytics__grid">
          <StatTable
            title="Расходы по категориям"
            loading={loading}
            isEmpty={!loading && byCategory.length === 0}
            emptyText="Нет расходов за период"
            footer={
              byCategory.length > TABLE_PREVIEW_ROWS ? (
                <Link to="/transactions" className="analytics__table-link">
                  Перейти ко всем категориям
                </Link>
              ) : null
            }
          >
            <thead>
              <tr>
                <th>Категория</th>
                <th className="analytics__th-num">Сумма</th>
                <th className="analytics__th-num">Доля</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.slice(0, TABLE_PREVIEW_ROWS).map((row, index) => (
                <tr key={row.category.id}>
                  <td>
                    <span className="analytics__category-cell">
                      <span
                        className={`analytics__dot analytics__dot--${categoryTagVariant(row.category.name, index)}`}
                        aria-hidden="true"
                      />
                      {row.category.name}
                    </span>
                  </td>
                  <td className="analytics__td-num">{formatMoney(row.total)}</td>
                  <td className="analytics__td-num">{formatPercent(row.percent)}</td>
                </tr>
              ))}
            </tbody>
          </StatTable>

          <StatTable
            title="Расходы по группам"
            loading={loading}
            isEmpty={!loading && byScope.length === 0}
            emptyText="Нет расходов в группах"
            footer={
              byScope.length > TABLE_PREVIEW_ROWS ? (
                <Link to="/transactions" className="analytics__table-link">
                  Перейти ко всем группам
                </Link>
              ) : null
            }
          >
            <thead>
              <tr>
                <th>Группа</th>
                <th className="analytics__th-num">Сумма</th>
                <th className="analytics__th-num">Оп.</th>
              </tr>
            </thead>
            <tbody>
              {byScope.slice(0, TABLE_PREVIEW_ROWS).map((row) => (
                <tr key={row.scope.id}>
                  <td>{row.scope.name}</td>
                  <td className="analytics__td-num">{formatMoney(row.total)}</td>
                  <td className="analytics__td-num">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </StatTable>

          <StatTable
            title="Расходы по тегам"
            loading={loading}
            isEmpty={!loading && byTag.length === 0}
            emptyText="Нет расходов с тегами"
            footer={
              byTag.length > TABLE_PREVIEW_ROWS ? (
                <Link to="/transactions" className="analytics__table-link">
                  Перейти ко всем тегам
                </Link>
              ) : null
            }
          >
            <thead>
              <tr>
                <th>Тег</th>
                <th className="analytics__th-num">Сумма</th>
                <th className="analytics__th-num">Оп.</th>
              </tr>
            </thead>
            <tbody>
              {byTag.slice(0, TABLE_PREVIEW_ROWS).map((row, index) => (
                <tr key={row.tag.id}>
                  <td>
                    <Tag variant={categoryTagVariant(row.tag.name, index)}>{row.tag.name}</Tag>
                  </td>
                  <td className="analytics__td-num">{formatMoney(row.total)}</td>
                  <td className="analytics__td-num">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </StatTable>

          <StatTable
            title="Расходы по времени"
            loading={loading}
            isEmpty={!loading && byTime.length === 0}
            emptyText="Нет расходов за период"
            headerExtra={
              <div className="analytics__time-tabs" role="tablist" aria-label="Группировка по времени">
                {TIME_GROUPING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={timeGrouping === opt.value}
                    className={`analytics__time-tab${timeGrouping === opt.value ? ' analytics__time-tab--active' : ''}`}
                    onClick={() => setTimeGrouping(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            }
          >
            <thead>
              <tr>
                <th>Период</th>
                <th className="analytics__th-num">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {byTime.slice(-TABLE_PREVIEW_ROWS).reverse().map((row) => (
                <tr key={row.period}>
                  <td>{formatTimePeriod(row.period, timeGrouping)}</td>
                  <td className="analytics__td-num analytics__td-num--expense">
                    {formatMoney(row.totalExpense)}
                  </td>
                </tr>
              ))}
            </tbody>
          </StatTable>
        </div>

        <p className="analytics__period-caption">Период: {periodLabel}</p>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  hint: string;
  variant: 'income' | 'expense' | 'balance';
  loading: boolean;
  valueClass?: string;
}

function SummaryCard({ label, value, hint, variant, loading, valueClass }: SummaryCardProps) {
  return (
    <article className={`analytics__summary-card analytics__summary-card--${variant}`}>
      <div className="analytics__summary-icon" aria-hidden="true">
        {variant === 'income' && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M6 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {variant === 'expense' && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 16V4M6 12l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {variant === 'balance' && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 9h14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </div>
      <div className="analytics__summary-body">
        <span className="analytics__summary-label">{label}</span>
        <span className={`analytics__summary-value${valueClass ? ` ${valueClass}` : ''}`}>
          {loading ? '…' : value}
        </span>
        <span className="analytics__summary-hint">{hint}</span>
      </div>
    </article>
  );
}

interface StatTableProps {
  title: string;
  loading: boolean;
  isEmpty: boolean;
  emptyText: string;
  children: ReactNode;
  footer?: ReactNode;
  headerExtra?: ReactNode;
}

function StatTable({ title, loading, isEmpty, emptyText, children, footer, headerExtra }: StatTableProps) {
  return (
    <section className="analytics__panel">
      <div className="analytics__panel-header">
        <h2 className="analytics__panel-title">{title}</h2>
        {headerExtra}
      </div>
      <div className="analytics__table-wrap">
        {loading ? (
          <p className="analytics__table-state">Загрузка…</p>
        ) : isEmpty ? (
          <p className="analytics__table-state">{emptyText}</p>
        ) : (
          <table className="analytics__table">{children}</table>
        )}
      </div>
      {footer && <div className="analytics__panel-footer">{footer}</div>}
    </section>
  );
}
