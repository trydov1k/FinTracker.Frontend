import { useEffect, useState } from 'react';
import { bulkUpdateTransactions, updateTransaction } from '../../api/transactions';
import type { CategoryDto, ScopeDto, TagDto, TransactionDto } from '../../api/types';
import { dateInputToUtcIso, utcIsoToDateInputValue } from '../../utils/date';
import '../UploadPage/ManualTransactionForm.css';
import './EditTransactionModal.css';

type TransactionKind = 'expense' | 'income';

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

interface EditTransactionModalProps {
  transaction: TransactionDto;
  categories: CategoryDto[];
  scopes: ScopeDto[];
  tags: TagDto[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

function formFromTransaction(tx: TransactionDto): FormState {
  return {
    kind: tx.amount >= 0 ? 'income' : 'expense',
    amount: String(Math.abs(tx.amount)),
    currency: tx.currency,
    date: utcIsoToDateInputValue(tx.dateUtc),
    description: tx.description ?? '',
    comment: tx.comment ?? '',
    categoryId: tx.category?.id ?? '',
    scopeId: tx.scope?.id ?? '',
    tagIds: tx.tags?.map((t) => t.id) ?? [],
  };
}

export function EditTransactionModal({
  transaction,
  categories,
  scopes,
  tags,
  onClose,
  onSaved,
  onError,
}: EditTransactionModalProps) {
  const [form, setForm] = useState<FormState>(() => formFromTransaction(transaction));
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setForm(formFromTransaction(transaction));
    setFieldError(null);
  }, [transaction]);

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
    const hadScope = Boolean(transaction.scope);
    const wantsScope = Boolean(form.scopeId);
    const needsTagClear = form.tagIds.length === 0 && (transaction.tags?.length ?? 0) > 0;

    setSubmitting(true);

    try {
      await updateTransaction(
        transaction.id,
        {
          amount: signedAmount,
          currency: form.currency,
          dateUtc: dateInputToUtcIso(form.date),
          description: form.description.trim(),
          comment: form.comment.trim(),
          categoryId: form.categoryId,
          ...(wantsScope
            ? { scopeId: form.scopeId }
            : hadScope
              ? { deleteScope: true }
              : {}),
          ...(form.tagIds.length > 0 ? { tagIds: form.tagIds } : {}),
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

      if (needsTagClear) {
        await bulkUpdateTransactions({
          transactionIds: [transaction.id],
          replaceTagIds: [],
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Не удалось сохранить транзакцию');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tx-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="tx-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-tx-title"
      >
        <div className="tx-modal__header">
          <h2 id="edit-tx-title" className="tx-modal__title">
            Изменить транзакцию
          </h2>
          <button type="button" className="tx-modal__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <form className="manual-form tx-modal__form" onSubmit={handleSubmit}>
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
          </label>

          {scopes.length > 0 && (
            <label className="manual-form__field">
              <span className="manual-form__label">Группа</span>
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
              <legend className="manual-form__label">Теги</legend>
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
              onClick={onClose}
              disabled={submitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="manual-form__btn manual-form__btn--primary"
              disabled={submitting || categories.length === 0}
            >
              {submitting ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
