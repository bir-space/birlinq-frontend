# birlinq-frontend

Веб-фронтенд проекта **Birlinq** (группа BirSpace). Next.js 15 + TypeScript + Tailwind CSS v4 + next-intl (RU / KK / EN). Работает поверх Laravel-бэкенда `birlinq-backend` (`/api/v1`).

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # укажи адрес бэкенда
npm run dev                  # http://localhost:3000
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Проверки: `npm run typecheck`, `npm run build`.

## Что реализовано

| Раздел | Маршрут | Бэкенд |
|---|---|---|
| Лендинг (ID • Move • Business) | `/` | статика |
| Публичная страница скана | `/q/[code]` | `GET /public/q/{code}` |
| Сценарий «машина блокирует» и др. | `/q/[code]` | `POST /public/q/{code}/scenarios/{id}` |
| Лид «хочу наклейку» | `/q/[code]` | `POST /public/q/{code}/lead` |
| Жалоба (abuse) | `/q/[code]` | `POST /public/q/{code}/abuse` |
| Регистрация / вход (email или телефон 77XXXXXXXXX) | `/register`, `/login` | `POST /auth/*` |
| Восстановление пароля, верификация email | `/forgot-password`, `/reset-password`, `/verify-email` | `POST /auth/password/*`, `/auth/verify-email` |
| Активация QR (мастер A1–A5) | `/activate?code=&token=` | `/qr/lookup`, `/entities`, `/entities/{id}/privacy`, `/qr/activate` |
| Инструкция: активация и наклейка на стекло | `/guide` | статика |
| Кабинет: обзор | `/dashboard` | `GET /owner/dashboard` |
| Кабинет: сообщения | `/dashboard/interactions` | `GET /owner/interactions`, `POST .../resolve` |
| Кабинет: мои QR (pause/resume) | `/dashboard/qr`, `/dashboard/qr/[id]` | `GET /qr`, `POST /qr/{id}/pause|resume` |

Админ-экраны из фигмы (ADM1–ADM3) сознательно **не** делались — админка уже есть на Filament (`/admin`).

## Архитектура

```
src/
├── app/[locale]/          # App Router, локали ru (default, без префикса) / kk / en
├── components/
│   ├── ui/                # дизайн-система: Button, Card, Input, Badge, Logo…
│   ├── landing|public|auth|activation|dashboard/
├── lib/
│   ├── api/               # types.ts (по openapi.yaml), client.ts (fetch + JWT refresh + Idempotency-Key), endpoints.ts
│   └── auth/              # token-store (access в памяти, refresh в localStorage), AuthProvider/useAuth
├── i18n/                  # next-intl: routing, request (namespace-файлы), navigation
messages/{ru,kk,en}/       # переводы по неймспейсам
```

Ключевые решения:

- **JWT**: access-токен только в памяти (TTL 15 мин), refresh — в localStorage с автоматической ротацией; на 401 клиент делает один refresh и повторяет запрос. Бэкенд-доки предлагают httpOnly-cookie через BFF — можно добавить позже, заменив `token-store.ts`, call-sites не изменятся.
- **Idempotency-Key** (UUID) автоматически ставится на activate/pause/resume/resolve/сценарии — как требует API.
- **Локали**: в URL ISO-код `kk`, бэкенду отправляется `kz` (`toApiLocale`).
- **Переиспользование для мобильного приложения**: `src/lib/api` и `src/lib/auth/token-store.ts` не зависят от Next/DOM (кроме localStorage, вынесенного за интерфейс) — переносятся в React Native почти без изменений вместе с типами.

## Дизайн

Бренд — монограмма «bq» (b=10 синий, q=01 фиолетовый, «первый сигнал → отклик»), знак и цвета вынесены в `src/app/globals.css` (@theme) и `src/components/ui/{Logo,LogoMark}.tsx`. Тёмная тема, почти чёрный фон `#06070b`, карточки `#10131c`, брендовый акцент `#2e63e0`, вертикали лендинга Move/ID/Business подкрашены синим/фиолетовым/зелёным. Подробности и правила использования — в `CLAUDE.md` и `CONVENTIONS.md`. Inter, радиусы 16/20/24px. Все экраны mobile-first (дизайн 390–440px), адаптив до 1440px.

Осознанные отклонения от макетов:

- P1–P3 в фигме нарисованы в светло-голубой теме — приведены к тёмной дизайн-системе продукта (стиль бордов Move/*).
- Кнопки «Скачать приложение» / сторы на лендинге заменены на CTA «Оставить заявку» — приложения ещё нет.
- Загрузка фото авто — заглушка (эндпоинта загрузки нет в API).
- Форма лида на лендинге не шлёт запрос (публичный lead-эндпоинт привязан к коду QR) — помечено TODO в `LeadForm.tsx`.
- Мобильные борды ID/* и Business/* — интерфейсы будущих вертикалей без поддержки в бэкенде MVP; в веб не переносились (MVP — Move).
