import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mergeImportResults, uploadImportFiles } from '../../api/import';
import type { MergedImportPreview, TransactionDto } from '../../api/types';
import { Tag } from '../../components/Tag/Tag';
import { categoryTagVariant } from '../../utils/categoryTag';
import { formatAmount, formatDatePeriod, formatDateShort } from '../../utils/format';
import { ManualTransactionForm } from './ManualTransactionForm';
import './UploadPage.css';

type UploadTab = 'import' | 'manual';

export function UploadPage() {
  const [activeTab, setActiveTab] = useState<UploadTab>('import');
  const [preview, setPreview] = useState<MergedImportPreview | null>(null);
  const [createdTransaction, setCreatedTransaction] = useState<TransactionDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualError = useCallback((message: string) => {
    setError(message || null);
  }, []);

  const handleManualSuccess = useCallback((transaction: TransactionDto) => {
    setCreatedTransaction(transaction);
    setError(null);
  }, []);

  const switchTab = (tab: UploadTab) => {
    setActiveTab(tab);
    setError(null);
  };

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const results = await uploadImportFiles(files);
      const merged = mergeImportResults(results);

      const failed = results.filter((r) => !r.success);
      if (failed.length > 0 && failed.length === results.length) {
        setError(failed.map((r) => `${r.fileName}: ${r.error}`).join('\n'));
        setPreview(null);
      } else {
        if (failed.length > 0) {
          setError(
            `Не удалось загрузить ${failed.length} из ${results.length} файлов:\n` +
              failed.map((r) => `${r.fileName}: ${r.error}`).join('\n'),
          );
        }
        setPreview(merged);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      setPreview(null);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      void handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  const handleCancelImport = () => {
    setPreview(null);
    setError(null);
  };

  const handleClearCreated = () => {
    setCreatedTransaction(null);
    setError(null);
  };

  const failedFiles = preview?.fileResults.filter((r) => !r.success) ?? [];

  return (
    <div className="upload">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".csv,.txt"
        className="upload__file-input"
        onChange={handleInputChange}
      />

      <div className="upload__left">
        <h1 className="upload__title">Загрузка транзакций</h1>
        <p className="upload__subtitle">
          Одна точка входа для импорта, ручного ввода и регулярных операций
        </p>

        <div className="upload__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'import'}
            className={`upload__tab${activeTab === 'import' ? ' upload__tab--active' : ''}`}
            onClick={() => switchTab('import')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 2V10M8 2L5 5M8 2L11 5M3 10V13H13V10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Импорт
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manual'}
            className={`upload__tab${activeTab === 'manual' ? ' upload__tab--active' : ''}`}
            onClick={() => switchTab('manual')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Вручную
          </button>
        </div>

        {activeTab === 'import' ? (
          <div className="upload__dropzone-card">
            <div
              className={`upload__dropzone${isDragOver ? ' upload__dropzone--active' : ''}${loading ? ' upload__dropzone--loading' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="upload__dropzone-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <path
                    d="M20 8V24M20 8L14 14M20 8L26 14M10 24V30H30V24"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="upload__dropzone-title">
                {loading
                  ? 'Загрузка и обработка файлов…'
                  : 'Перетащите CSV или выберите файлы'}
              </p>
              <p className="upload__dropzone-hint">
                Поддержка: CSV, выписки банков, экспорт из Excel
              </p>
              <button
                type="button"
                className="upload__select-btn"
                onClick={openFilePicker}
                disabled={loading}
              >
                {loading ? 'Загрузка…' : 'Выбрать файлы'}
              </button>
            </div>
          </div>
        ) : (
          <div className="upload__dropzone-card">
            <ManualTransactionForm
              onSuccess={handleManualSuccess}
              onError={handleManualError}
            />
          </div>
        )}

        {error && (
          <div className="upload__error" role="alert">
            {error.split('\n').map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}
      </div>

      <div className="upload__right">
        <div className="upload__preview-card">
          {activeTab === 'import' ? (
            <>
              <div className="upload__preview-header">
                <h2 className="upload__preview-title">Предпросмотр импорта</h2>
                <p className="upload__preview-subtitle">
                  Сопоставление колонок, проверка качества и результат до записи в систему
                </p>
              </div>

              {!preview ? (
                <div className="upload__preview-empty">
                  <p>Выберите файлы для импорта, чтобы увидеть предпросмотр</p>
                </div>
              ) : (
                <>
                  <div className="upload__stats">
                    <div className="upload__stat">
                      <span className="upload__stat-icon" aria-hidden="true">📅</span>
                      <div className="upload__stat-body">
                        <span className="upload__stat-label">Период</span>
                        <span className="upload__stat-value">
                          {preview.period
                            ? formatDatePeriod(preview.period.from, preview.period.to)
                            : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="upload__stat">
                      <span className="upload__stat-icon" aria-hidden="true">📋</span>
                      <div className="upload__stat-body">
                        <span className="upload__stat-label">Транзакции</span>
                        <span className="upload__stat-value">{preview.imported}</span>
                      </div>
                    </div>
                    <div className="upload__stat">
                      <span className="upload__stat-icon" aria-hidden="true">↑</span>
                      <div className="upload__stat-body">
                        <span className="upload__stat-label">Доходы</span>
                        <span className="upload__stat-value upload__stat-value--success">
                          {preview.incomeCount}
                        </span>
                      </div>
                    </div>
                    <div className="upload__stat">
                      <span className="upload__stat-icon" aria-hidden="true">↓</span>
                      <div className="upload__stat-body">
                        <span className="upload__stat-label">Расходы</span>
                        <span className="upload__stat-value upload__stat-value--warning">
                          {preview.expenseCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {preview.categories.length > 0 && (
                    <div className="upload__categories">
                      <span className="upload__categories-label">Найденные категории</span>
                      <div className="upload__categories-tags">
                        {preview.categories.map((cat, i) => (
                          <Tag key={cat.name} variant={categoryTagVariant(cat.name, i)}>
                            {cat.name} x {cat.count}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {failedFiles.length > 0 && (
                    <div className="upload__file-errors">
                      {failedFiles.map((f) => (
                        <p key={f.fileName}>
                          <strong>{f.fileName}:</strong> {f.error}
                        </p>
                      ))}
                    </div>
                  )}

                  {preview.preview.length > 0 ? (
                    <div className="upload__table-wrap">
                      <table className="upload__table">
                        <thead>
                          <tr>
                            <th>Дата</th>
                            <th>Описание</th>
                            <th>Сумма</th>
                            <th>Категория</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.preview.map((tx, i) => (
                            <tr key={`${tx.dateUtc}-${tx.description}-${i}`}>
                              <td>{formatDateShort(tx.dateUtc)}</td>
                              <td>{tx.description ?? '—'}</td>
                              <td>
                                <span
                                  className={`upload__amount upload__amount--${tx.amount >= 0 ? 'income' : 'expense'}`}
                                >
                                  {formatAmount(tx.amount)}
                                </span>
                              </td>
                              <td>
                                <Tag variant={categoryTagVariant(tx.category, i)}>
                                  {tx.category}
                                </Tag>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="upload__preview-empty upload__preview-empty--inline">
                      Транзакции импортированы, но предпросмотр пуст
                    </p>
                  )}

                  <div className="upload__preview-actions">
                    <button
                      type="button"
                      className="upload__btn upload__btn--secondary"
                      onClick={handleCancelImport}
                    >
                      Отмена
                    </button>
                    <Link to="/transactions" className="upload__btn upload__btn--primary">
                      К транзакциям
                    </Link>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="upload__preview-header">
                <h2 className="upload__preview-title">Созданная транзакция</h2>
                <p className="upload__preview-subtitle">
                  Проверьте данные перед переходом к списку транзакций
                </p>
              </div>

              {!createdTransaction ? (
                <div className="upload__preview-empty">
                  <p>Заполните форму слева и нажмите «Добавить транзакцию»</p>
                </div>
              ) : (
                <>
                  <div className="upload__manual-result">
                    <div className="upload__manual-result-row">
                      <span className="upload__manual-result-label">Дата</span>
                      <span>{formatDateShort(createdTransaction.dateUtc)}</span>
                    </div>
                    <div className="upload__manual-result-row">
                      <span className="upload__manual-result-label">Описание</span>
                      <span>{createdTransaction.description ?? '—'}</span>
                    </div>
                    <div className="upload__manual-result-row">
                      <span className="upload__manual-result-label">Сумма</span>
                      <span
                        className={`upload__amount upload__amount--${createdTransaction.amount >= 0 ? 'income' : 'expense'}`}
                      >
                        {formatAmount(createdTransaction.amount, createdTransaction.currency === 'RUB' ? '₽' : createdTransaction.currency)}
                      </span>
                    </div>
                    <div className="upload__manual-result-row">
                      <span className="upload__manual-result-label">Категория</span>
                      <Tag variant={categoryTagVariant(createdTransaction.category?.name ?? '')}>
                        {createdTransaction.category?.name ?? '—'}
                      </Tag>
                    </div>
                    {createdTransaction.scope?.name && (
                      <div className="upload__manual-result-row">
                        <span className="upload__manual-result-label">Группа</span>
                        <Tag variant="purple">{createdTransaction.scope.name}</Tag>
                      </div>
                    )}
                    {(createdTransaction.tags?.length ?? 0) > 0 && (
                      <div className="upload__manual-result-row">
                        <span className="upload__manual-result-label">Теги</span>
                        <div className="upload__manual-result-tags">
                          {createdTransaction.tags?.map((tag, i) => (
                            <Tag key={tag.id} variant={categoryTagVariant(tag.name, i)}>
                              {tag.name}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                    {createdTransaction.comment && (
                      <div className="upload__manual-result-row">
                        <span className="upload__manual-result-label">Комментарий</span>
                        <span>{createdTransaction.comment}</span>
                      </div>
                    )}
                  </div>

                  <div className="upload__preview-actions">
                    <button
                      type="button"
                      className="upload__btn upload__btn--secondary"
                      onClick={handleClearCreated}
                    >
                      Добавить ещё
                    </button>
                    <Link to="/transactions" className="upload__btn upload__btn--primary">
                      К транзакциям
                    </Link>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
