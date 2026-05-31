import { useEffect, useState } from 'react';
import { bulkUpdateTransactions, updateTransaction } from '../../api/transactions';
import type { CategoryDto, ScopeDto, TagDto, TransactionDto } from '../../api/types';
import './EditTransactionModal.css';
import './TransactionQuickActionModal.css';

export type QuickActionType =
  | 'category'
  | 'scope'
  | 'comment'
  | 'addTags'
  | 'replaceTags';

interface TransactionQuickActionModalProps {
  action: QuickActionType;
  transaction: TransactionDto;
  categories: CategoryDto[];
  scopes: ScopeDto[];
  tags: TagDto[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

const titles: Record<QuickActionType, string> = {
  category: 'Изменить категорию',
  scope: 'Добавить в группу',
  comment: 'Задать комментарий',
  addTags: 'Добавить теги',
  replaceTags: 'Заменить теги',
};

export function TransactionQuickActionModal({
  action,
  transaction,
  categories,
  scopes,
  tags,
  onClose,
  onSaved,
  onError,
}: TransactionQuickActionModalProps) {
  const [categoryId, setCategoryId] = useState(transaction.category?.id ?? '');
  const [scopeId, setScopeId] = useState('');
  const [comment, setComment] = useState(transaction.comment ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCategoryId(transaction.category?.id ?? '');
    setScopeId('');
    setComment(transaction.comment ?? '');
    setSelectedTagIds([]);
  }, [transaction, action]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      switch (action) {
        case 'category':
          if (!categoryId) {
            onError('Выберите категорию');
            return;
          }
          await updateTransaction(
            transaction.id,
            { categoryId },
            {
              categoryId,
              categories,
              scopes,
              tags,
            },
          );
          break;
        case 'scope':
          if (!scopeId) {
            onError('Выберите группу');
            return;
          }
          await updateTransaction(
            transaction.id,
            { scopeId },
            {
              categoryId: transaction.category.id,
              scopeId,
              categories,
              scopes,
              tags,
            },
          );
          break;
        case 'comment':
          await updateTransaction(transaction.id, { comment });
          break;
        case 'addTags':
          if (selectedTagIds.length === 0) {
            onError('Выберите хотя бы один тег');
            return;
          }
          await bulkUpdateTransactions({
            transactionIds: [transaction.id],
            addTagIds: selectedTagIds,
          });
          break;
        case 'replaceTags':
          await bulkUpdateTransactions({
            transactionIds: [transaction.id],
            replaceTagIds: selectedTagIds,
          });
          break;
      }

      onSaved();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Не удалось применить изменения');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tx-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="tx-modal tx-quick-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-action-title"
      >
        <div className="tx-modal__header">
          <h2 id="quick-action-title" className="tx-modal__title">
            {titles[action]}
          </h2>
          <button type="button" className="tx-modal__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <form className="tx-quick-modal__form" onSubmit={handleSubmit}>
          {action === 'category' && (
            <label className="tx-quick-modal__field">
              <span className="tx-quick-modal__label">Категория</span>
              <select
                className="tx-quick-modal__select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {action === 'scope' && (
            <label className="tx-quick-modal__field">
              <span className="tx-quick-modal__label">Группа</span>
              <select
                className="tx-quick-modal__select"
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
              >
                <option value="">Выберите группу</option>
                {scopes.map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    {scope.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {action === 'comment' && (
            <label className="tx-quick-modal__field">
              <span className="tx-quick-modal__label">Комментарий</span>
              <input
                type="text"
                className="tx-quick-modal__input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий к транзакции"
              />
            </label>
          )}

          {(action === 'addTags' || action === 'replaceTags') && (
            <fieldset className="tx-quick-modal__field">
              <legend className="tx-quick-modal__label">
                {action === 'addTags' ? 'Теги для добавления' : 'Новый набор тегов'}
              </legend>
              {tags.length === 0 ? (
                <p className="tx-quick-modal__hint">Тегов пока нет</p>
              ) : (
                <div className="tx-quick-modal__tags">
                  {tags.map((tag) => (
                    <label key={tag.id} className="tx-quick-modal__tag">
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={() => toggleTag(tag.id)}
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          <div className="tx-quick-modal__actions">
            <button
              type="button"
              className="tx-quick-modal__btn tx-quick-modal__btn--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Отмена
            </button>
            <button type="submit" className="tx-quick-modal__btn tx-quick-modal__btn--primary" disabled={submitting}>
              {submitting ? 'Сохранение…' : 'Применить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
