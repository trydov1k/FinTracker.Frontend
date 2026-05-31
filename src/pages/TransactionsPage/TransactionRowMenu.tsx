import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { bulkUpdateTransactions, deleteTransaction, updateTransaction } from '../../api/transactions';
import type { CategoryDto, ScopeDto, TagDto, TransactionDto } from '../../api/types';
import { EditTransactionModal } from './EditTransactionModal';
import { TransactionQuickActionModal, type QuickActionType } from './TransactionQuickActionModal';

interface TransactionRowMenuProps {
  transaction: TransactionDto;
  categories: CategoryDto[];
  scopes: ScopeDto[];
  tags: TagDto[];
  disabled?: boolean;
  onRefresh: () => void;
  onError: (message: string) => void;
}

type RowDialog = 'edit' | QuickActionType | null;

export function TransactionRowMenu({
  transaction,
  categories,
  scopes,
  tags,
  disabled,
  onRefresh,
  onError,
}: TransactionRowMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<RowDialog>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setMenuOpen(false);

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 220;
      setMenuStyle({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - menuWidth),
      });
    }
    setMenuOpen(true);
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };

    const handleScroll = () => closeMenu();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuOpen]);

  const openDialog = (next: RowDialog) => {
    closeMenu();
    setDialog(next);
  };

  const runAction = async (action: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await action();
      onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Не удалось выполнить операцию');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    closeMenu();
    if (!window.confirm('Удалить эту транзакцию?')) return;
    void runAction(() => deleteTransaction(transaction.id));
  };

  const handleRemoveScope = () => {
    closeMenu();
    if (!transaction.scope) return;
    if (!window.confirm('Убрать транзакцию из группы?')) return;
    void runAction(async () => {
      await updateTransaction(transaction.id, { deleteScope: true });
    });
  };

  const handleClearTags = () => {
    closeMenu();
    if ((transaction.tags?.length ?? 0) === 0) return;
    if (!window.confirm('Очистить теги у этой транзакции?')) return;
    void runAction(() =>
      bulkUpdateTransactions({
        transactionIds: [transaction.id],
        replaceTagIds: [],
      }),
    );
  };

  const hasScope = Boolean(transaction.scope);
  const hasTags = (transaction.tags?.length ?? 0) > 0;
  const isBusy = disabled || actionLoading;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`transactions__row-menu${menuOpen ? ' transactions__row-menu--open' : ''}`}
        aria-label="Действия с транзакцией"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        disabled={isBusy}
        onClick={() => (menuOpen ? closeMenu() : openMenu())}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="3" r="1.2" fill="currentColor" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
          <circle cx="8" cy="13" r="1.2" fill="currentColor" />
        </svg>
      </button>

      {menuOpen &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            className="transactions__row-dropdown"
            style={{ top: menuStyle.top, left: menuStyle.left }}
            role="menu"
          >
            <button
              type="button"
              className="transactions__more-item"
              role="menuitem"
              onClick={() => openDialog('edit')}
            >
              Изменить транзакцию
            </button>
            <button
              type="button"
              className="transactions__more-item transactions__more-item--danger"
              role="menuitem"
              onClick={handleDelete}
            >
              Удалить транзакцию
            </button>
            <div className="transactions__row-dropdown-divider" role="separator" />
            <button
              type="button"
              className="transactions__more-item"
              role="menuitem"
              onClick={() => openDialog('category')}
            >
              Изменить категорию
            </button>
            <button
              type="button"
              className="transactions__more-item"
              role="menuitem"
              onClick={() => openDialog('scope')}
              disabled={scopes.length === 0}
            >
              Добавить в группу
            </button>
            <button
              type="button"
              className="transactions__more-item"
              role="menuitem"
              onClick={handleRemoveScope}
              disabled={!hasScope}
            >
              Убрать из группы
            </button>
            <button
              type="button"
              className="transactions__more-item"
              role="menuitem"
              onClick={() => openDialog('comment')}
            >
              Задать комментарий
            </button>
            <button
              type="button"
              className="transactions__more-item"
              role="menuitem"
              onClick={() => openDialog('addTags')}
              disabled={tags.length === 0}
            >
              Добавить теги
            </button>
            <button
              type="button"
              className="transactions__more-item"
              role="menuitem"
              onClick={() => openDialog('replaceTags')}
              disabled={tags.length === 0}
            >
              Заменить теги
            </button>
            <button
              type="button"
              className="transactions__more-item transactions__more-item--danger"
              role="menuitem"
              onClick={handleClearTags}
              disabled={!hasTags}
            >
              Очистить теги
            </button>
          </div>,
          document.body,
        )}

      {dialog === 'edit' && (
        <EditTransactionModal
          transaction={transaction}
          categories={categories}
          scopes={scopes}
          tags={tags}
          onClose={() => setDialog(null)}
          onSaved={onRefresh}
          onError={onError}
        />
      )}

      {dialog && dialog !== 'edit' && (
        <TransactionQuickActionModal
          action={dialog}
          transaction={transaction}
          categories={categories}
          scopes={scopes}
          tags={tags}
          onClose={() => setDialog(null)}
          onSaved={onRefresh}
          onError={onError}
        />
      )}
    </>
  );
}
