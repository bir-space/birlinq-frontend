# birlinq-frontend

Клиентская часть проекта **Birlinq** (группа BirSpace) — монорепо на npm workspaces. Сейчас в нём веб-приложение `apps/web` (Next.js 15 + TypeScript + Tailwind CSS v4 + next-intl, RU / KK / EN); общие пакеты (`api`, `i18n`, `tokens`) уже вынесены в `packages/`, мобильное приложение на Expo появится в `apps/mobile` (см. `docs/architecture/monorepo.md`). Работает поверх Laravel-бэкенда `birlinq-backend` (`/api/v1`).

## Быстрый старт

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # укажи адрес бэкенда
npm run dev                  # http://localhost:3000
```

`apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Проверки: `npm run typecheck`, `npm run build`.

## Документация

| Файл | Что внутри |
|---|---|
| `CLAUDE.md` | Правила работы в репозитории: стек, инварианты, антипаттерны |
| `CONVENTIONS.md` | Дизайн-система: токены, логотип, API компонентов, i18n, работа с Figma |
| `docs/decision-log.md` | Решения этого репозитория (`FE-NNN`, append-only) и открытые вопросы |
| `docs/architecture/monorepo.md` | Структура монорепо, границы пакетов, модель релизов, статус миграции |

Контракт с бэкендом — его OpenAPI-спека; решения, затрагивающие обе стороны, живут в логе бэкенда.

## Что реализовано

| Раздел | Маршрут | Бэкенд |
|---|---|---|
| Лендинг (ID • Move • Business) | `/` | статика |
| Публичная страница скана (car и personal) | `/q/[code]` | `GET /public/q/{code}` |
| Сценарий «машина блокирует» и др. | `/q/[code]` | `POST /public/q/{code}/scenarios/{id}` |
| Лид «хочу наклейку» | `/q/[code]` | `POST /public/q/{code}/lead` |
| Жалоба (abuse) | `/q/[code]` | `POST /public/q/{code}/abuse` |
| Регистрация / вход (email или телефон 77XXXXXXXXX) | `/register`, `/login` | `POST /auth/*` |
| Выход из текущей сессии и «выйти везде» | шапка кабинета | `POST /auth/logout`, `/auth/logout-all` |
| Восстановление пароля, верификация email | `/forgot-password`, `/reset-password`, `/verify-email` | `POST /auth/password/*`, `/auth/verify-email` |
| Активация QR (мастер A1–A5) | `/activate?code=&token=` | `/qr/lookup`, `/entities`, `/entities/{id}/privacy`, `/qr/activate` |
| Инструкция: активация и наклейка на стекло | `/guide` | статика |
| Кабинет: обзор | `/dashboard` | `GET /owner/dashboard` |
| Кабинет: сообщения | `/dashboard/interactions` | `GET /owner/interactions`, `POST .../resolve` |
| Кабинет: мои QR (pause/resume) | `/dashboard/qr`, `/dashboard/qr/[id]` | `GET /qr`, `POST /qr/{id}/pause|resume` |

Админ-экраны из фигмы (ADM1–ADM3) сознательно **не** делались — админка уже есть на Filament (`/admin`).

## Архитектура

Репозиторий — монорепо на npm workspaces (FE-001). Все команды запускаются из корня.
Границы пакетов и статус миграции — в `docs/architecture/monorepo.md`.

```
packages/                  # общее для всех клиентов; без Next.js и без DOM
├── api/src/               # types.ts (по openapi.yaml), client.ts (fetch + JWT refresh +
│                          # Idempotency-Key), endpoints.ts, limits.ts, config.ts
├── i18n/                  # messages/{ru,kk,en}/*.json, locales, NAMESPACES, loadMessages
└── tokens/theme.css       # дизайн-токены (Tailwind @theme)

apps/web/src/
├── app/[locale]/          # App Router, локали ru (default, без префикса) / kk / en
├── components/
│   ├── ui/                # дизайн-система: Button, Card, Input, Badge, Logo…
│   ├── landing|public|auth|activation|dashboard/
├── lib/
│   ├── api-config.ts      # configureApi({ baseUrl, tokenStore }) — привязка пакета к вебу
│   ├── app-env.tsx        # какая реализация API и префикс ссылок (боевая или /mock)
│   └── auth/              # token-store (access в памяти, refresh в localStorage), AuthProvider/useAuth
├── i18n/                  # next-intl: routing, request, navigation
```

Ключевые решения:

- **JWT**: access-токен только в памяти (TTL 15 мин), refresh — в localStorage с автоматической ротацией; на 401 клиент делает один refresh и повторяет запрос. Бэкенд-доки предлагают httpOnly-cookie через BFF — можно добавить позже, заменив `token-store.ts`, call-sites не изменятся.
- **Idempotency-Key** (UUID) автоматически ставится там, где бэкенд включил middleware: activate, pause, resume и отправка сценария. На `resolve` его нет — маршрут без middleware, а операция идемпотентна сама по себе.
- **Logout посессионный**: `POST /auth/logout` гасит только текущую сессию (бэкенд кладёт id refresh-токена в claim access-токена), остальные устройства остаются в системе; «выйти везде» — отдельная кнопка на `/auth/logout-all`.
- **Приватность публичной страницы**: скрытые поля бэкенд *не присылает вовсе* (не `null`). Поэтому «ключа нет» и «владелец скрыл» — один и тот же случай, и фронт никогда не выводит «скрыто» по отсутствию поля.
- **Дубликаты сценариев**: повторная отправка того же сценария тем же посетителем в окне дедупликации возвращает `202` со `status: "duplicate"` — экран благодарности показывается, но текстом «владелец уже знает».
- **Локали**: в URL ISO-код `kk`, бэкенду отправляется `kz` (`toApiLocale`). Публичные эндпоинты берут локаль только из `Accept-Language`, поэтому `scan` и `submitLead` шлют её заголовком — иначе событие скана логируется с локалью браузера, а не страницы.
- **Коды из писем**: бэкенд отправляет 64-символьный токен без ссылки, поэтому `/reset-password` и `/verify-email` принимают его в поле вручную; `?token=` в URL остаётся опциональным диплинком.
- **Лимиты полей** собраны в `packages/api/src/limits.ts` по Form Requests бэкенда — `maxLength` на инпутах, чтобы длинная вставка не стоила лишнего 422 (а на троттлящихся публичных эндпоинтах — и 429).
- **Переиспользование для мобильного приложения**: `packages/api` не знает ни адреса бэкенда, ни способа хранить сессию — и то и другое приходит через `configureApi({ baseUrl, tokenStore })`. Мобильное приложение вызовет ту же функцию с `EXPO_PUBLIC_API_URL` и хранилищем на Keychain/Keystore, внутри пакета не меняется ничего.

## Дизайн

Бренд — монограмма «bq» (b=10 синий, q=01 фиолетовый, «первый сигнал → отклик»), знак и цвета вынесены в `packages/tokens/theme.css` (@theme) и `apps/web/src/components/ui/{Logo,LogoMark}.tsx`. Тёмная тема, почти чёрный фон `#06070b`, карточки `#10131c`, брендовый акцент `#2e63e0`, вертикали лендинга Move/ID/Business подкрашены синим/фиолетовым/зелёным. Подробности и правила использования — в `CLAUDE.md` и `CONVENTIONS.md`. Inter, радиусы 16/20/24px. Все экраны mobile-first (дизайн 390–440px), адаптив до 1440px.

Осознанные отклонения от макетов:

- P1–P3 в фигме нарисованы в светло-голубой теме — приведены к тёмной дизайн-системе продукта (стиль бордов Move/*).
- Кнопки «Скачать приложение» / сторы на лендинге заменены на CTA «Оставить заявку» — приложения ещё нет.
- Загрузка фото авто — заглушка (эндпоинта загрузки нет в API).
- Форма лида на лендинге не шлёт запрос (публичный lead-эндпоинт привязан к коду QR) — помечено TODO в `LeadForm.tsx`.
- Мобильные борды ID/* и Business/* — интерфейсы будущих вертикалей без поддержки в бэкенде MVP; в веб не переносились (MVP — Move).
