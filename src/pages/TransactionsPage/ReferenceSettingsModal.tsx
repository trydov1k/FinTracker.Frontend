import { useEffect, useState } from 'react';
import {
  createCategory,
  createScope,
  createTag,
  deleteCategory,
  deleteScope,
  deleteTag,
  updateCategory,
  updateScope,
} from '../../api/references';
import type { CategoryDto, ScopeDto, TagDto } from '../../api/types';
import './ReferenceSettingsModal.css';

type SettingsTab = 'categories' | 'tags' | 'scopes';

interface ReferenceSettingsModalProps {
  open: boolean;
  categories: CategoryDto[];
  tags: TagDto[];
  scopes: ScopeDto[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'categories', label: 'Категории' },
  { id: 'tags', label: 'Теги' },
  { id: 'scopes', label: 'Группы' },
];

export function ReferenceSettingsModal({
  open,
  categories,
  tags,
  scopes,
  onClose,
  onRefresh,
}: ReferenceSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('categories');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setNewName('');
      setEditingId(null);
      setEditName('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const items =
    activeTab === 'categories' ? categories : activeTab === 'tags' ? tags : scopes;

  const canEdit = activeTab !== 'tags';
  const maxLength = activeTab === 'tags' ? 50 : 100;
  const entityLabel =
    activeTab === 'categories' ? 'категорию' : activeTab === 'tags' ? 'тег' : 'группу';

  const runAction = async (action: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await action();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить операцию');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    void runAction(async () => {
      if (activeTab === 'categories') await createCategory(name);
      else if (activeTab === 'tags') await createTag(name);
      else await createScope(name);
      setNewName('');
    });
  };

  const handleSaveEdit = () => {
    const name = editName.trim();
    if (!editingId || !name) return;

    void runAction(async () => {
      if (activeTab === 'categories') await updateCategory(editingId, name);
      else await updateScope(editingId, name);
      setEditingId(null);
      setEditName('');
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Удалить «${name}»?`)) return;

    void runAction(async () => {
      if (activeTab === 'categories') await deleteCategory(id);
      else if (activeTab === 'tags') await deleteTag(id);
      else await deleteScope(id);
      if (editingId === id) {
        setEditingId(null);
        setEditName('');
      }
    });
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  return (
    <div className="ref-settings-overlay" onClick={onClose} role="presentation">
      <div
        className="ref-settings"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ref-settings-title"
      >
        <div className="ref-settings__header">
          <h2 id="ref-settings-title" className="ref-settings__title">
            Настройки
          </h2>
          <button
            type="button"
            className="ref-settings__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="ref-settings__tabs" role="tablist">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={`ref-settings__tab${activeTab === id ? ' ref-settings__tab--active' : ''}`}
              onClick={() => {
                setActiveTab(id);
                setEditingId(null);
                setEditName('');
                setError(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'tags' && (
          <p className="ref-settings__hint">
            Теги можно только создавать и удалять — API не поддерживает переименование.
          </p>
        )}

        {error && (
          <div className="ref-settings__error" role="alert">
            {error}
          </div>
        )}

        <ul className="ref-settings__list">
          {items.length === 0 ? (
            <li className="ref-settings__empty">Пока ничего нет</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="ref-settings__item">
                {editingId === item.id ? (
                  <div className="ref-settings__edit-row">
                    <input
                      type="text"
                      className="ref-settings__input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={maxLength}
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="ref-settings__icon-btn ref-settings__icon-btn--save"
                      onClick={handleSaveEdit}
                      disabled={loading || !editName.trim()}
                      aria-label="Сохранить"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="ref-settings__icon-btn"
                      onClick={() => {
                        setEditingId(null);
                        setEditName('');
                      }}
                      disabled={loading}
                      aria-label="Отмена"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="ref-settings__item-name">{item.name}</span>
                    <div className="ref-settings__item-actions">
                      {canEdit && (
                        <button
                          type="button"
                          className="ref-settings__icon-btn"
                          onClick={() => startEdit(item.id, item.name)}
                          disabled={loading}
                          aria-label={`Изменить ${item.name}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path
                              d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        className="ref-settings__icon-btn ref-settings__icon-btn--danger"
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={loading}
                        aria-label={`Удалить ${item.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path
                            d="M3 4H13M6 4V3H10V4M5 4V13H11V4"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>

        <form className="ref-settings__create" onSubmit={handleCreate}>
          <input
            type="text"
            className="ref-settings__input"
            placeholder={`Новая ${entityLabel}`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={maxLength}
            disabled={loading}
          />
          <button
            type="submit"
            className="ref-settings__create-btn"
            disabled={loading || !newName.trim()}
          >
            Добавить
          </button>
        </form>
      </div>
    </div>
  );
}
