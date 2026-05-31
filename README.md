# FinTracker Frontend

Веб-интерфейс сервиса для сбора и агрегации финансовых трат.

## Запуск

```bash
npm install
npm run dev
```

Приложение будет доступно по адресу [http://localhost:5173](http://localhost:5173).

Бэкенд API по умолчанию: `http://localhost:5009` (настраивается через `.env` → `VITE_API_URL`).

## Страницы

| Маршрут | Описание |
|---------|----------|
| `/` | Главная |
| `/upload` | Загрузка транзакций |
| `/transactions` | Список транзакций |
| `/analytics` | Аналитика (заглушка) |
| `/about` | О нас (заглушка) |

## Стек

- React 19 + TypeScript
- Vite
- React Router
