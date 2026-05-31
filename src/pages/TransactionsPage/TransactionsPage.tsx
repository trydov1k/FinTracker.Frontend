import { useCallback, useEffect, useRef, useState } from 'react';
import {
  bulkUpdateTransactions,
  deleteTransaction,
  getCategories,
  getScopes,
  getTags,
  getTransactions,
} from '../../api/transactions';
import type { BulkUpdateDto, CategoryDto, ScopeDto, TagDto, TransactionDto } from '../../api/types';
import { Tag } from '../../components/Tag/Tag';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { categoryTagVariant } from '../../utils/categoryTag';
import { currencySymbol, formatAmount, formatDateLong } from '../../utils/format';
import { filtersToApiQuery, countActiveFilters, createDefaultFilters, type TransactionFiltersState } from '../../utils/transactionFilters';
import { TransactionsFiltersPanel } from './TransactionsFiltersPanel';
import { ReferenceSettingsModal } from './ReferenceSettingsModal';
import { TransactionRowMenu } from './TransactionRowMenu';
import './TransactionsPage.css';

type BulkPanel = 'category' | 'scope' | 'comment' | 'addTags' | 'replaceTags' | null;

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [scopes, setScopes] = useState<ScopeDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<TransactionFiltersState>(createDefaultFilters);
  const [draftFilters, setDraftFilters] = useState<TransactionFiltersState>(createDefaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPanel, setBulkPanel] = useState<BulkPanel>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkScopeId, setBulkScopeId] = useState('');
  const [bulkComment, setBulkComment] = useState('');
  const [bulkTagIds, setBulkTagIds] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const activeFilterCount = countActiveFilters(filters);

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

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTransactions(
        filtersToApiQuery(filters, debouncedSearch, page, pageSize),
      );
      setTransactions(data);
      setSelectedIds(new Set());
      setBulkPanel(null);
      setMoreMenuOpen(false);
      setBulkComment('');
      setBulkTagIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить транзакции');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, page, pageSize]);

  useEffect(() => {
    void loadReferences().catch(() => {
      /* справочники необязательны для отображения списка */
    });
  }, [loadReferences]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (!moreMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

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

  const resetPage = () => setPage(1);

  const patchFilter = (partial: Partial<TransactionFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    resetPage();
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
    resetPage();
  };

  const resetFilters = () => {
    const defaults = createDefaultFilters();
    setDraftFilters(defaults);
    setFilters(defaults);
    setFiltersOpen(false);
    resetPage();
  };

  const openBulkPanel = (panel: Exclude<BulkPanel, null>) => {
    if (selectedIds.size === 0) return;
    setMoreMenuOpen(false);
    setBulkPanel((current) => (current === panel ? null : panel));
  };

  const runBulkUpdate = async (
    dto: Omit<BulkUpdateDto, 'transactionIds'>,
  ) => {
    if (selectedIds.size === 0) return;

    setActionLoading(true);
    setError(null);

    try {
      await bulkUpdateTransactions({
        transactionIds: [...selectedIds],
        ...dto,
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось применить изменения');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBulkTag = (tagId: string) => {
    setBulkTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleRemoveScope = async () => {
    setMoreMenuOpen(false);
    if (!window.confirm(`Убрать ${selectedIds.size} транзакций из группы?`)) return;
    await runBulkUpdate({ deleteScope: true });
  };

  const handleClearTags = async () => {
    setMoreMenuOpen(false);
    if (!window.confirm(`Очистить теги у ${selectedIds.size} транзакций?`)) return;
    await runBulkUpdate({ replaceTagIds: [] });
  };

  const handleBulkComment = async () => {
    await runBulkUpdate({ comment: bulkComment });
  };

  const handleBulkAddTags = async () => {
    if (bulkTagIds.length === 0) return;
    await runBulkUpdate({ addTagIds: bulkTagIds });
  };

  const selectMorePanel = (panel: 'comment' | 'addTags' | 'replaceTags') => {
    setMoreMenuOpen(false);
    setBulkTagIds([]);
    setBulkComment('');
    setBulkPanel((current) => (current === panel ? null : panel));
  };

  const renderBulkTagPicker = (mode: 'addTags' | 'replaceTags') => (
    <div className="transactions__bulk-panel transactions__bulk-panel--tags">
      <span className="transactions__bulk-panel-label">
        {mode === 'addTags' ? 'Теги для добавления' : 'Новый набор тегов'}
      </span>
      {tags.length === 0 ? (
        <span className="transactions__bulk-panel-hint">Тегов пока нет</span>
      ) : (
        <div className="transactions__bulk-tags">
          {tags.map((tag) => (
            <label key={tag.id} className="transactions__bulk-tag-option">
              <input
                type="checkbox"
                checked={bulkTagIds.includes(tag.id)}
                onChange={() => toggleBulkTag(tag.id)}
                disabled={actionLoading}
              />
              <span>{tag.name}</span>
            </label>
          ))}
        </div>
      )}
      <button
        type="button"
        className="transactions__bulk-apply"
        onClick={() => void (mode === 'addTags' ? handleBulkAddTags() : handleBulkReplaceTags())}
        disabled={
          actionLoading ||
          noSelection ||
          (mode === 'addTags' && bulkTagIds.length === 0)
        }
      >
        Применить
      </button>
    </div>
  );

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === transactions.length && transactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const refresh = () => {
    void loadTransactions();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Удалить ${selectedIds.size} транзакций?`)) return;

    setActionLoading(true);
    setError(null);

    try {
      await Promise.all([...selectedIds].map((id) => deleteTransaction(id)));
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить транзакции');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkCategory = async () => {
    if (!bulkCategoryId || selectedIds.size === 0) return;
    await runBulkUpdate({ categoryId: bulkCategoryId });
  };

  const handleBulkScope = async () => {
    if (!bulkScopeId || selectedIds.size === 0) return;
    await runBulkUpdate({ scopeId: bulkScopeId });
  };

  const handleBulkReplaceTags = async () => {
    await runBulkUpdate({ replaceTagIds: bulkTagIds });
  };

  const selectedCount = selectedIds.size;
  const noSelection = selectedCount === 0;
  const allSelected = transactions.length > 0 && selectedCount === transactions.length;
  const hasNextPage = transactions.length === pageSize;
  const rangeStart = transactions.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = (page - 1) * pageSize + transactions.length;

  return (
    <div className="transactions">
      <div className="transactions__card">
        <div className="transactions__toolbar">
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
              onChange={(e) => patchFilter({ type: e.target.value as TransactionFiltersState['type'] })}
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
              onChange={setDraftFilters}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          )}
          </div>

          {error && (
            <div className="transactions__error" role="alert">
              {error}
            </div>
          )}

          <div className="transactions__bulk-row">
              <label className="transactions__bulk-select">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="transactions__checkbox"
                  disabled={actionLoading || transactions.length === 0}
                />
                <span>Выбрано {selectedCount}</span>
              </label>

              <div className="transactions__bulk-actions">
                <button
                  type="button"
                  className="transactions__bulk-btn transactions__bulk-btn--danger"
                  onClick={() => void handleBulkDelete()}
                  disabled={actionLoading || noSelection}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 4H13M6 4V3H10V4M5 4V13H11V4"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Удалить
                </button>
                <button
                  type="button"
                  className="transactions__bulk-btn transactions__bulk-btn--primary"
                  onClick={() => openBulkPanel('scope')}
                  disabled={actionLoading || noSelection}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 5H13V13H3V5ZM3 5L5 3H11L13 5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Добавить в группу
                </button>
                <button
                  type="button"
                  className="transactions__bulk-btn transactions__bulk-btn--success"
                  onClick={() => openBulkPanel('category')}
                  disabled={actionLoading || noSelection}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Изменить категорию
                </button>

                <div className="transactions__bulk-more" ref={moreMenuRef}>
                  <button
                    type="button"
                    className={`transactions__bulk-btn transactions__bulk-btn--more${moreMenuOpen ? ' transactions__bulk-btn--more-open' : ''}`}
                    onClick={() => selectedCount > 0 && setMoreMenuOpen((open) => !open)}
                    disabled={actionLoading || noSelection}
                    aria-expanded={moreMenuOpen}
                    aria-haspopup="menu"
                  >
                    Ещё
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {moreMenuOpen && (
                    <div className="transactions__more-menu" role="menu">
                      <button
                        type="button"
                        className="transactions__more-item"
                        role="menuitem"
                        onClick={() => void handleRemoveScope()}
                      >
                        Убрать из группы
                      </button>
                      <button
                        type="button"
                        className="transactions__more-item"
                        role="menuitem"
                        onClick={() => selectMorePanel('comment')}
                      >
                        Задать комментарий
                      </button>
                      <button
                        type="button"
                        className="transactions__more-item"
                        role="menuitem"
                        onClick={() => selectMorePanel('addTags')}
                      >
                        Добавить теги
                      </button>
                      <button
                        type="button"
                        className="transactions__more-item"
                        role="menuitem"
                        onClick={() => selectMorePanel('replaceTags')}
                      >
                        Заменить теги
                      </button>
                      <button
                        type="button"
                        className="transactions__more-item transactions__more-item--danger"
                        role="menuitem"
                        onClick={() => void handleClearTags()}
                      >
                        Очистить теги
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="transactions__settings-btn"
                onClick={() => setSettingsOpen(true)}
                disabled={actionLoading}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                  <path
                    d="M8 1.5V3M8 13V14.5M14.5 8H13M3 8H1.5M12.7 3.3L11.6 4.4M4.4 11.6L3.3 12.7M12.7 12.7L11.6 11.6M4.4 4.4L3.3 3.3"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                Настроить
              </button>

              {bulkPanel === 'category' && (
                <div className="transactions__bulk-panel">
                  <select
                    className="transactions__select"
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="transactions__bulk-apply"
                    onClick={() => void handleBulkCategory()}
                    disabled={!bulkCategoryId || actionLoading || noSelection}
                  >
                    Применить
                  </button>
                </div>
              )}

              {bulkPanel === 'scope' && (
                <div className="transactions__bulk-panel">
                  <select
                    className="transactions__select"
                    value={bulkScopeId}
                    onChange={(e) => setBulkScopeId(e.target.value)}
                  >
                    <option value="">Выберите группу</option>
                    {scopes.map((scope) => (
                      <option key={scope.id} value={scope.id}>
                        {scope.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="transactions__bulk-apply"
                    onClick={() => void handleBulkScope()}
                    disabled={!bulkScopeId || actionLoading || noSelection}
                  >
                    Применить
                  </button>
                </div>
              )}

              {bulkPanel === 'comment' && (
                <div className="transactions__bulk-panel">
                  <input
                    type="text"
                    className="transactions__bulk-comment-input"
                    placeholder="Комментарий для выбранных транзакций"
                    value={bulkComment}
                    onChange={(e) => setBulkComment(e.target.value)}
                    disabled={actionLoading}
                  />
                  <button
                    type="button"
                    className="transactions__bulk-apply"
                    onClick={() => void handleBulkComment()}
                    disabled={actionLoading || noSelection}
                  >
                    Применить
                  </button>
                </div>
              )}

              {bulkPanel === 'addTags' && renderBulkTagPicker('addTags')}
              {bulkPanel === 'replaceTags' && renderBulkTagPicker('replaceTags')}
            </div>
        </div>

        <div className="transactions__table-wrap">
          <table className="transactions__table">
            <thead>
              <tr>
                <th className="transactions__th-checkbox" aria-hidden="true" />
                <th>Дата</th>
                <th>Описание</th>
                <th>Категория</th>
                <th>Сумма</th>
                <th>Теги</th>
                <th>Группа</th>
                <th>Комментарий</th>
                <th className="transactions__th-actions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="transactions__state-cell">
                    Загрузка транзакций…
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="transactions__state-cell">
                    {activeFilterCount > 0 || debouncedSearch
                      ? 'Ничего не найдено по заданным фильтрам'
                      : 'Транзакций за выбранный период пока нет'}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={selectedIds.has(tx.id) ? 'transactions__row--selected' : ''}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tx.id)}
                        onChange={() => toggleRow(tx.id)}
                        className="transactions__checkbox"
                        aria-label={`Выбрать ${tx.description ?? 'транзакцию'}`}
                        disabled={actionLoading}
                      />
                    </td>
                    <td className="transactions__td-date">{formatDateLong(tx.dateUtc)}</td>
                    <td className="transactions__td-description">{tx.description ?? '—'}</td>
                    <td>{tx.category?.name ?? '—'}</td>
                    <td>
                      <span
                        className={`transactions__amount transactions__amount--${tx.amount >= 0 ? 'income' : 'expense'}`}
                      >
                        {formatAmount(tx.amount, currencySymbol(tx.currency))}
                      </span>
                    </td>
                    <td>
                      <div className="transactions__tags">
                        {tx.tags?.map((tag, i) => (
                          <Tag key={tag.id} variant={categoryTagVariant(tag.name, i)}>
                            {tag.name}
                          </Tag>
                        ))}
                      </div>
                    </td>
                    <td>
                      {tx.scope?.name && (
                        <Tag variant={categoryTagVariant(tx.scope.name)}>
                          {tx.scope.name}
                        </Tag>
                      )}
                    </td>
                    <td className="transactions__td-comment">{tx.comment ?? ''}</td>
                    <td className="transactions__td-actions">
                      <TransactionRowMenu
                        transaction={tx}
                        categories={categories}
                        scopes={scopes}
                        tags={tags}
                        disabled={actionLoading}
                        onRefresh={refresh}
                        onError={setError}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="transactions__footer">
          <div className="transactions__page-size">
            <span>Показать по:</span>
            <select
              className="transactions__page-size-select"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); resetPage(); }}
              disabled={loading}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="transactions__pagination">
            <button
              type="button"
              className="transactions__page-btn"
              aria-label="Предыдущая страница"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="transactions__page-btn transactions__page-btn--active"
              disabled
            >
              {page}
            </button>
            <button
              type="button"
              className="transactions__page-btn"
              aria-label="Следующая страница"
              disabled={!hasNextPage || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
            <span className="transactions__page-info">
              {rangeStart === 0
                ? '0 из 0'
                : hasNextPage
                  ? `${rangeStart}–${rangeEnd}`
                  : `${rangeStart}–${rangeEnd} из ${rangeEnd}`}
            </span>
          </div>
        </div>
      </div>

      <ReferenceSettingsModal
        open={settingsOpen}
        categories={categories}
        tags={tags}
        scopes={scopes}
        onClose={() => setSettingsOpen(false)}
        onRefresh={loadReferences}
      />
    </div>
  );
}
