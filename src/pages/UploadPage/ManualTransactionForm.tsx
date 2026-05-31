import { useEffect, useRef, useState } from 'react';
import { createTransaction, getCategories, getScopes, getTags } from '../../api/transactions';
import type { CategoryDto, ScopeDto, TagDto, TransactionDto } from '../../api/types';
import { dateInputToUtcIso, todayDateInputValue } from '../../utils/date';
import './ManualTransactionForm.css';

type TransactionKind = 'expense' | 'income';

interface ManualTransactionFormProps {
  onSuccess: (transaction: TransactionDto) => void;
  onError: (message: string) => void;
}

interface FormState {
  kind: TransactionKind;
  amount: string;
  currency: string;
  date: string;
  description: string;
  comment: string;
  categoryId: string;
  scopeId: string;
  tagIds: string[];
}

const initialFormState = (): FormState => ({
  kind: 'expense',
  amount: '',
  currency: 'RUB',
  date: todayDateInputValue(),
  description: '',
  comment: '',
  categoryId: '',
  scopeId: '',
  tagIds: [],
});

export function ManualTransactionForm({ onSuccess, onError }: ManualTransactionFormProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [scopes, setScopes] = useState<ScopeDto[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    async function loadReferences() {
      setLoadingRefs(true);

      try {
        const [cats, tagList, scopeList] = await Promise.all([
          getCategories(),
          getTags(),
          getScopes(),
        ]);

        if (cancelled) return;

        setCategories(cats);
        setTags(tagList);
        setScopes(scopeList);
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current(
            err instanceof Error ? err.message : 'Не удалось загрузить справочники',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRefs(false);
        }
      }
    }

    void loadReferences();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldError(null);
  };

  const toggleTag = (tagId: string) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const parsedAmount = parseFloat(form.amount.replace(',', '.'));
    if (!form.amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setFieldError('Укажите сумму больше нуля');
      return;
    }

    if (!form.categoryId) {
      setFieldError('Выберите категорию');
      return;
    }

    if (!form.date) {
      setFieldError('Укажите дату');
      return;
    }

    const signedAmount = form.kind === 'expense' ? -parsedAmount : parsedAmount;

    setSubmitting(true);

    try {
      const created = await createTransaction(
        {
          amount: signedAmount,
          currency: form.currency,
          dateUtc: dateInputToUtcIso(form.date),
          description: form.description.trim() || undefined,
          comment: form.comment.trim() || undefined,
          categoryId: form.categoryId,
          scopeId: form.scopeId || undefined,
          tagIds: form.tagIds,
        },
        {
          categoryId: form.categoryId,
          scopeId: form.scopeId || undefined,
          tagIds: form.tagIds,
          categories,
          scopes,
          tags,
        },
      );

      onSuccess(created);
      setForm(initialFormState());
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Не удалось создать транзакцию');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialFormState());
    setFieldError(null);
  };

  if (loadingRefs) {
    return (
      <div className="manual-form manual-form--loading">
        <p>Загрузка категорий и тегов…</p>
      </div>
    );
  }

  return (
    <form className="manual-form" onSubmit={handleSubmit}>
      <div className="manual-form__kind">
        <button
          type="button"
          className={`manual-form__kind-btn${form.kind === 'expense' ? ' manual-form__kind-btn--active manual-form__kind-btn--expense' : ''}`}
          onClick={() => updateField('kind', 'expense')}
        >
          Расход
        </button>
        <button
          type="button"
          className={`manual-form__kind-btn${form.kind === 'income' ? ' manual-form__kind-btn--active manual-form__kind-btn--income' : ''}`}
          onClick={() => updateField('kind', 'income')}
        >
          Доход
        </button>
      </div>

      <div className="manual-form__row manual-form__row--2">
        <label className="manual-form__field">
          <span className="manual-form__label">Сумма</span>
          <input
            type="text"
            inputMode="decimal"
            className="manual-form__input"
            placeholder="0,00"
            value={form.amount}
            onChange={(e) => updateField('amount', e.target.value)}
            required
          />
        </label>
        <label className="manual-form__field">
          <span className="manual-form__label">Валюта</span>
          <select
            className="manual-form__select"
            value={form.currency}
            onChange={(e) => updateField('currency', e.target.value)}
          >
            <option value="RUB">₽ RUB</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>
        </label>
      </div>

      <label className="manual-form__field">
        <span className="manual-form__label">Дата</span>
        <input
          type="date"
          className="manual-form__input"
          value={form.date}
          onChange={(e) => updateField('date', e.target.value)}
          required
        />
      </label>

      <label className="manual-form__field">
        <span className="manual-form__label">Описание</span>
        <input
          type="text"
          className="manual-form__input"
          placeholder="Например, Такси Яндекс Go"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </label>

      <label className="manual-form__field">
        <span className="manual-form__label">Категория</span>
        <select
          className="manual-form__select"
          value={form.categoryId}
          onChange={(e) => updateField('categoryId', e.target.value)}
          required
        >
          <option value="">Выберите категорию</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <span className="manual-form__hint">
            Категорий пока нет — импортируйте выписку или создайте категорию в API
          </span>
        )}
      </label>

      {scopes.length > 0 && (
        <label className="manual-form__field">
          <span className="manual-form__label">Группа (необязательно)</span>
          <select
            className="manual-form__select"
            value={form.scopeId}
            onChange={(e) => updateField('scopeId', e.target.value)}
          >
            <option value="">Без группы</option>
            {scopes.map((scope) => (
              <option key={scope.id} value={scope.id}>
                {scope.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {tags.length > 0 && (
        <fieldset className="manual-form__field manual-form__tags">
          <legend className="manual-form__label">Теги (необязательно)</legend>
          <div className="manual-form__tags-list">
            {tags.map((tag) => (
              <label key={tag.id} className="manual-form__tag-option">
                <input
                  type="checkbox"
                  checked={form.tagIds.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="manual-form__field">
        <span className="manual-form__label">Комментарий</span>
        <textarea
          className="manual-form__textarea"
          placeholder="Дополнительные заметки"
          rows={3}
          value={form.comment}
          onChange={(e) => updateField('comment', e.target.value)}
        />
      </label>

      {fieldError && (
        <p className="manual-form__field-error" role="alert">
          {fieldError}
        </p>
      )}

      <div className="manual-form__actions">
        <button
          type="button"
          className="manual-form__btn manual-form__btn--secondary"
          onClick={handleReset}
          disabled={submitting}
        >
          Очистить
        </button>
        <button
          type="submit"
          className="manual-form__btn manual-form__btn--primary"
          disabled={submitting || categories.length === 0}
        >
          {submitting ? 'Сохранение…' : 'Добавить транзакцию'}
        </button>
      </div>
    </form>
  );
}
