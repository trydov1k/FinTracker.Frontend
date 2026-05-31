import type { CategoryDto, ScopeDto, TagDto, TransactionTypeFilter } from '../../api/types';
import type { TransactionFiltersState } from '../../utils/transactionFilters';
import './TransactionsFiltersPanel.css';

interface TransactionsFiltersPanelProps {
  draft: TransactionFiltersState;
  categories: CategoryDto[];
  scopes: ScopeDto[];
  tags: TagDto[];
  onChange: (draft: TransactionFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
}

export function TransactionsFiltersPanel({
  draft,
  categories,
  scopes,
  tags,
  onChange,
  onApply,
  onReset,
}: TransactionsFiltersPanelProps) {
  const patch = (partial: Partial<TransactionFiltersState>) => {
    onChange({ ...draft, ...partial });
  };

  const toggleTag = (tagId: string) => {
    const next = draft.tagIds.includes(tagId)
      ? draft.tagIds.filter((id) => id !== tagId)
      : [...draft.tagIds, tagId];
    patch({ tagIds: next });
  };

  return (
    <div className="tx-filters">
      <div className="tx-filters__grid">
        <label className="tx-filters__field">
          <span className="tx-filters__label">Дата с</span>
          <input
            type="date"
            className="tx-filters__input"
            value={draft.dateFrom}
            onChange={(e) => patch({ dateFrom: e.target.value })}
          />
        </label>

        <label className="tx-filters__field">
          <span className="tx-filters__label">Дата по</span>
          <input
            type="date"
            className="tx-filters__input"
            value={draft.dateTo}
            onChange={(e) => patch({ dateTo: e.target.value })}
          />
        </label>

        <label className="tx-filters__field tx-filters__field--wide">
          <span className="tx-filters__label">Поиск</span>
          <input
            type="search"
            className="tx-filters__input"
            placeholder="По описанию…"
            value={draft.search}
            onChange={(e) => patch({ search: e.target.value })}
            maxLength={50}
          />
        </label>

        <label className="tx-filters__field">
          <span className="tx-filters__label">Сумма от</span>
          <input
            type="text"
            inputMode="decimal"
            className="tx-filters__input"
            placeholder="0"
            value={draft.amountMin}
            onChange={(e) => patch({ amountMin: e.target.value })}
          />
        </label>

        <label className="tx-filters__field">
          <span className="tx-filters__label">Сумма до</span>
          <input
            type="text"
            inputMode="decimal"
            className="tx-filters__input"
            placeholder="0"
            value={draft.amountMax}
            onChange={(e) => patch({ amountMax: e.target.value })}
          />
        </label>

        <label className="tx-filters__field">
          <span className="tx-filters__label">Категория</span>
          <select
            className="tx-filters__select"
            value={draft.categoryId}
            onChange={(e) => patch({ categoryId: e.target.value })}
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <label className="tx-filters__field">
          <span className="tx-filters__label">Тип</span>
          <select
            className="tx-filters__select"
            value={draft.type}
            onChange={(e) => patch({ type: e.target.value as TransactionTypeFilter })}
          >
            <option value="">Все типы</option>
            <option value="Expense">Расходы</option>
            <option value="Income">Доходы</option>
          </select>
        </label>

        <label className="tx-filters__field">
          <span className="tx-filters__label">Группа</span>
          <select
            className="tx-filters__select"
            value={draft.scopeId}
            onChange={(e) => patch({ scopeId: e.target.value, excludeScopes: false })}
            disabled={draft.excludeScopes}
          >
            <option value="">Все группы</option>
            {scopes.map((scope) => (
              <option key={scope.id} value={scope.id}>
                {scope.name}
              </option>
            ))}
          </select>
        </label>

        <label className="tx-filters__field tx-filters__field--check">
          <input
            type="checkbox"
            checked={draft.excludeScopes}
            onChange={(e) =>
              patch({
                excludeScopes: e.target.checked,
                scopeId: e.target.checked ? '' : draft.scopeId,
              })
            }
          />
          <span>Только без группы</span>
        </label>
      </div>

      {tags.length > 0 && (
        <fieldset className="tx-filters__tags">
          <legend className="tx-filters__label">Теги</legend>
          <div className="tx-filters__tags-list">
            {tags.map((tag) => (
              <label key={tag.id} className="tx-filters__tag-option">
                <input
                  type="checkbox"
                  checked={draft.tagIds.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="tx-filters__actions">
        <button type="button" className="tx-filters__btn tx-filters__btn--secondary" onClick={onReset}>
          Сбросить
        </button>
        <button type="button" className="tx-filters__btn tx-filters__btn--primary" onClick={onApply}>
          Применить
        </button>
      </div>
    </div>
  );
}
