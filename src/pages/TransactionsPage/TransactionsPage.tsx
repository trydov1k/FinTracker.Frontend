import { useState } from 'react';
import { Tag } from '../../components/Tag/Tag';
import './TransactionsPage.css';

type TagVariant = 'blue' | 'green' | 'purple' | 'orange' | 'teal';

interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: string;
  amountType: 'income' | 'expense';
  tags: { label: string; variant: TagVariant }[];
  group?: { label: string; variant: TagVariant };
  comment?: string;
  selected?: boolean;
}

const mockTransactions: Transaction[] = [
  {
    id: 1,
    date: '15 мая 2024',
    description: 'Такси Яндекс Go',
    category: 'Транспорт',
    amount: '-842,50 ₽',
    amountType: 'expense',
    tags: [],
  },
  {
    id: 2,
    date: '14 мая 2024',
    description: 'Пятёрочка',
    category: 'Продукты',
    amount: '-1 245,30 ₽',
    amountType: 'expense',
    tags: [{ label: 'Продукты', variant: 'green' }],
    group: { label: 'Продукты на неделю', variant: 'green' },
    selected: true,
  },
  {
    id: 3,
    date: '14 мая 2024',
    description: 'Кофейня',
    category: 'Кафе',
    amount: '-350,00 ₽',
    amountType: 'expense',
    tags: [{ label: 'Кафе', variant: 'blue' }],
    selected: true,
  },
  {
    id: 4,
    date: '13 мая 2024',
    description: 'Зарплата',
    category: 'Доходы',
    amount: '+85 000,00 ₽',
    amountType: 'income',
    tags: [],
  },
  {
    id: 5,
    date: '12 мая 2024',
    description: 'Ozon.ru',
    category: 'Покупки',
    amount: '-2 890,00 ₽',
    amountType: 'expense',
    tags: [{ label: 'Онлайн', variant: 'purple' }],
    group: { label: 'Онлайн покупки', variant: 'purple' },
    selected: true,
  },
  {
    id: 6,
    date: '11 мая 2024',
    description: 'Метро',
    category: 'Транспорт',
    amount: '-65,00 ₽',
    amountType: 'expense',
    tags: [],
  },
  {
    id: 7,
    date: '10 мая 2024',
    description: 'Netflix',
    category: 'Подписки',
    amount: '-799,00 ₽',
    amountType: 'expense',
    tags: [{ label: 'Подписки', variant: 'blue' }],
  },
  {
    id: 8,
    date: '09 мая 2024',
    description: 'Перевод другу',
    category: 'Переводы',
    amount: '-5 000,00 ₽',
    amountType: 'expense',
    tags: [{ label: 'Перевод', variant: 'orange' }],
    comment: 'За обед',
  },
];

export function TransactionsPage() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(mockTransactions.filter((t) => t.selected).map((t) => t.id)),
  );

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === mockTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mockTransactions.map((t) => t.id)));
    }
  };

  const selectedCount = selectedIds.size;
  const allSelected = selectedCount === mockTransactions.length;

  return (
    <div className="transactions">
      <div className="transactions__card">
        <div className="transactions__toolbar">
          <div className="transactions__filters-row">
            <div className="transactions__date-picker">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M2 6H14M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span>01.05.2024 – 31.05.2024</span>
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
              />
            </div>

            <select className="transactions__select" defaultValue="">
              <option value="">Все категории</option>
            </select>
            <select className="transactions__select" defaultValue="">
              <option value="">Все типы</option>
            </select>
            <select className="transactions__select" defaultValue="">
              <option value="">Все группы</option>
            </select>

            <button type="button" className="transactions__filter-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2 4H14M4 8H12M6 12H10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Фильтры
            </button>
          </div>

          {selectedCount > 0 && (
            <div className="transactions__bulk-row">
              <label className="transactions__bulk-select">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="transactions__checkbox"
                />
                <span>Выбрано {selectedCount}</span>
              </label>

              <div className="transactions__bulk-actions">
                <button type="button" className="transactions__bulk-btn transactions__bulk-btn--danger">
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
                <button type="button" className="transactions__bulk-btn transactions__bulk-btn--primary">
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
                <button type="button" className="transactions__bulk-btn transactions__bulk-btn--success">
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
                <button type="button" className="transactions__bulk-btn">
                  Ещё
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <button type="button" className="transactions__settings-btn">
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
            </div>
          )}
        </div>

        <div className="transactions__table-wrap">
          <table className="transactions__table">
            <thead>
              <tr>
                <th className="transactions__th-checkbox">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="transactions__checkbox"
                    aria-label="Выбрать все"
                  />
                </th>
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
              {mockTransactions.map((tx) => (
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
                      aria-label={`Выбрать ${tx.description}`}
                    />
                  </td>
                  <td className="transactions__td-date">{tx.date}</td>
                  <td className="transactions__td-description">{tx.description}</td>
                  <td>{tx.category}</td>
                  <td>
                    <span className={`transactions__amount transactions__amount--${tx.amountType}`}>
                      {tx.amount}
                    </span>
                  </td>
                  <td>
                    <div className="transactions__tags">
                      {tx.tags.map((tag) => (
                        <Tag key={tag.label} variant={tag.variant}>
                          {tag.label}
                        </Tag>
                      ))}
                    </div>
                  </td>
                  <td>
                    {tx.group && (
                      <Tag variant={tx.group.variant}>{tx.group.label}</Tag>
                    )}
                  </td>
                  <td className="transactions__td-comment">{tx.comment ?? ''}</td>
                  <td>
                    <button
                      type="button"
                      className="transactions__row-menu"
                      aria-label="Действия"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="3" r="1.2" fill="currentColor" />
                        <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                        <circle cx="8" cy="13" r="1.2" fill="currentColor" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="transactions__footer">
          <div className="transactions__page-size">
            <span>Показать по:</span>
            <select className="transactions__page-size-select" defaultValue="25">
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="transactions__pagination">
            <button type="button" className="transactions__page-btn" aria-label="Предыдущая страница">
              ‹
            </button>
            <button type="button" className="transactions__page-btn transactions__page-btn--active">
              1
            </button>
            <button type="button" className="transactions__page-btn">2</button>
            <button type="button" className="transactions__page-btn">3</button>
            <span className="transactions__page-ellipsis">…</span>
            <button type="button" className="transactions__page-btn">10</button>
            <button type="button" className="transactions__page-btn" aria-label="Следующая страница">
              ›
            </button>
            <span className="transactions__page-info">1–25 из 243</span>
          </div>
        </div>
      </div>
    </div>
  );
}
