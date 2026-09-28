# birlinq-frontend

Клиентская часть проекта **Birlinq** (группа BirSpace) — монорепо на npm workspaces: веб-приложение `apps/web` (Next.js 15 + Tailwind CSS v4 + next-intl, RU / KK / EN), мобильное `apps/mobile` (Expo SDK 57 + Expo Router + NativeWind) и общие пакеты `api`, `core`, `i18n`, `tokens`, `platform` в `packages/` (см. `docs/architecture/monorepo.md`). Работает поверх Laravel-бэкенда `birlinq-backend` (`/api/v1`).

## Быстрый старт

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # укажи адрес бэкенда
npm run dev                  # http://localhost:3000
```

`apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # публичный VAPID-ключ, выдаёт бэкенд; без него карточка уведомлений скрыта
NEXT_PUBLIC_APP_URL=            # публичный origin фронта (https://…, без слэша в конце): уходит в QR-код и ссылки визитки, вшивается при next build; пусто = origin браузера, для локальной проверки этого достаточно
```

Проверки: `npm run typecheck`, `npm run build`. Для мобильного — `npx expo-doctor` и `npm run bundle:check` из `apps/mobile`.

### Push-уведомления: где работают и как проверить

Push живёт только на **https** и на `localhost` у разработчика. Телефон, открывший dev-сервер по `http://192.168.x.x:3000`, увидит в карточке «нужен https» — это норма, а не баг. Значит, на телефонах проверка идёт через боевой домен, и там должно быть собрано то, что лежит в репозитории:

1. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` задан на сервере **до** `next build` — он вшивается в бандл, `next start` его уже не прочитает.
2. `next build` из актуального коммита, затем рестарт процесса.
3. Контроль без телефона: `https://<домен>/sw.js` отдаёт JavaScript (не 404), `/manifest.webmanifest` — JSON, в `/guide` есть раздел «Уведомления на телефоне».
4. У бэкенда заданы `VAPID_*` и `FRONTEND_URL` = адрес фронта: по нему собираются ссылки внутри уведомлений.

Сценарий по платформам (FE-009):

- **Android** (Chrome, Samsung Internet): кабинет → «Включить уведомления» → системный запрос. Внутри Telegram / WhatsApp / Instagram push не работает — карточка просит открыть страницу в браузере.
- **iPhone** (iOS 16.4+): только из приложения на экране «Домой». В обычной вкладке Safari кнопки нет — вместо неё шаги «Поделиться → На экран Домой». У приложения на экране «Домой» своё хранилище: вход делается заново внутри него, и там уже появляется кнопка. Тот же путь с шагами доступен по ссылке `/guide#push`.
- **Компьютер:** кнопка «Включить»; уведомления приходят, пока браузер запущен.
- В шапке карточки стоит бейдж устройства (Компьютер / iPhone / Android) — по нему видно, какой из трёх сценариев отрисовался, даже на скриншоте. В dev-сборке под карточкой дополнительно печатается `push: <state> · <platform> · standalone=…`.
- **Посмотреть все три сценария без телефона:** DevTools → Toggle device toolbar → iPhone или Pixel, перезагрузить `/dashboard`. Сценарий выбирается по User-Agent, а для iOS решение «вкладка или приложение» принимается по `standalone`, а не по наличию API — поэтому эмуляция iPhone честно показывает шаги установки, а эмуляция Android — кнопку.

### Визитки Business: чек-лист деплоя

- `NEXT_PUBLIC_APP_URL` = публичный origin фронта задан **до** `next build` — как и VAPID-ключ, он вшивается в бандл. Именно этот адрес уходит в QR-код визитки (`/p/{alias}`), в «Поделиться» и в `metadataBase`. Пустое значение локально безвредно (берётся origin браузера), а в проде даст QR на `localhost`.
- В `apps/web/src/content/legal/*.ru.json` заполнены плейсхолдеры `[уточняется]` — название ТОО, БИН, юрадрес, support-email, домен (FE-013). Пока они на месте, юрстраницы публиковать нельзя.
- У бэкенда: `php artisan storage:link` (фото и обложки визиток), `APP_URL` = публичный origin API — фронт показывает изображения только с этого origin, `FRONTEND_URL` = адрес фронта; демо-визитка `/p/demo` появляется после `php artisan db:seed --class=DemoCardSeeder` с заданным `DEMO_SEED_PASSWORD`.
- Контроль без бэкенда: `/mock/p/demo` (десять тем через `?theme=`), `/mock/p/demo/qr` — скачанный PNG сканируется телефоном и ведёт на `<NEXT_PUBLIC_APP_URL>/p/demo`.

Мобильное приложение:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
npm start -w apps/mobile     # Expo dev server, дальше a / i для устройства
```

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
| Web push: подписка | карточка в `/dashboard` | `POST /push/subscribe`, `DELETE /push/unsubscribe` |
| Инструкция «как включить уведомления» для iOS / Android | `/guide#push` | статика |
| Переключатель Move ⇄ Business и пилюля профиля в полосе табов | шапка кабинета | — |
| Мои QR: наклейка, привязанная к визитке, ведёт в её редактор | `/dashboard/qr`, `/dashboard/qr/[id]` | `GET /qr` (entity `type=personal`) |
| Публичная визитка по ссылке (десять тем, `?theme=` — превью) | `/p/[alias]` | `GET /public/c/{alias}` |
| Сохранить контакт (vCard), клики по контактам и шеринг | `/p/[alias]`, `/q/[code]` | `GET …/vcard`, `POST …/events` |
| Жалоба на визитку (оба входа) | `/p/[alias]`, `/q/[code]` | `POST /public/c/{alias}/abuse`, `POST /public/q/{code}/abuse` |
| QR-страница визитки (SVG на экране, PNG 512 px на скачивание) | `/p/[alias]/qr` | `GET /public/c/{alias}` для сводки; сам QR рисует `qrcode` в браузере |
| Кабинет Business: обзор за 30 дней по всем визиткам | `/dashboard/business` | `GET /entities?type=personal`, `GET /entities/{id}/stats` |
| Кабинет Business: список визиток, удаление | `/dashboard/cards` | `GET /entities?type=personal`, `DELETE /entities/{id}` |
| Создание визитки (вложенные `contact` и `privacy_settings`, пресет приватности) | `/dashboard/cards/new` | `POST /entities` (`Idempotency-Key`) |
| Редактор визитки: профиль, контакты, соцсети, теги, дата рождения, тема | `/dashboard/cards/[id]` | `GET /entities/{id}`, `PUT /entities/{id}/contact` |
| Редактор: фото и обложка (downscale до 2048 px в браузере) | `/dashboard/cards/[id]` | `POST /entities/{id}/contact/photo`, `…/contact/cover`; очистка — `PUT …/contact` с `null` |
| Редактор: приватность (17 переключателей, пресеты) | `/dashboard/cards/[id]` | `PATCH /entities/{id}/privacy` |
| Редактор: адрес `/p/{alias}`, публикация, удаление | `/dashboard/cards/[id]` | `PATCH /entities/{id}` (`alias`, `status`), `DELETE /entities/{id}` |
| Редактор: QR визитки и «Привязать наклейку» (код + токен активации) | `/dashboard/cards/[id]` | `POST /qr/lookup`, `POST /qr/activate` |
| Редактор: статистика (просмотры QR / ссылка, клики по каналам, vCard, шеринг) | `/dashboard/cards/[id]` | `GET /entities/{id}/stats` |
| Тарифы (статичные планы, CTA «Оставить заявку») | `/dashboard/pricing` | статика |
| Профиль: имя, телефон (с паролем), смена пароля, «выйти везде» | `/dashboard/profile` | `PATCH /auth/me`, `POST /auth/password/change`, `POST /auth/logout-all` |
| Юрстраницы (русский текст, рамка на трёх языках) | `/privacy`, `/terms`, `/offer`, `/consent` | статика (`content/legal/*.ru.json`) |

Админ-экраны из фигмы (ADM1–ADM3) сознательно **не** делались — админка уже есть на Filament (`/admin`).

Всё это есть и в `/mock` без бэкенда: секции «Business» и «Визитка» на `/mock` ведут на каждый новый маршрут — кабинет Business целиком, `/mock/p/demo` и `/mock/p/demo/qr`, `/mock/p/card-x7k2` (скрытая визитка, 410), `/mock/q/PERS1234` (визитка по наклейке), редактор заблокированной визитки.

## Архитектура

Репозиторий — монорепо на npm workspaces (FE-001). Все команды запускаются из корня.
Границы пакетов и статус миграции — в `docs/architecture/monorepo.md`.

```
packages/                  # общее для всех клиентов; без Next.js и без DOM
├── api/src/               # types.ts (по openapi.yaml), client.ts (fetch + JWT refresh +
│                          # Idempotency-Key), endpoints.ts, limits.ts, config.ts
├── i18n/                  # messages/{ru,kk,en}/*.json, locales, NAMESPACES, loadMessages
├── tokens/theme.css       # дизайн-токены (Tailwind @theme)
├── platform/src/          # контракт Platform: PlatformProvider, usePlatform,
│                          # useApi, useHref — без реализаций
└── core/src/              # headless-хуки для обоих клиентов: AuthProvider/useAuth,
                           # useOverview, useInteractions, useQrList, useCards, useCard,
                           # useCreateCard, useCardStats, useBusinessOverview, useProfile,
                           # пресеты приватности — без JSX и без переведённых строк
                           # (ошибки возвращаются кодами)

apps/web/src/
├── app/[locale]/          # App Router, локали ru (default, без префикса) / kk / en
├── components/
│   ├── ui/                # дизайн-система: Button, Card, Input, Select, ConfirmModal, Badge, Logo…
│   ├── landing|public|auth|activation|dashboard/
│   ├── card|business|forms|legal/   # публичная визитка, кабинет Business, формы, юрстраницы
├── content/legal/         # тексты юрдокументов: RU, только для серверных компонентов (FE-013)
├── lib/
│   ├── api-config.ts      # configureApi({ baseUrl, tokenStore }) — привязка пакета к вебу
│   ├── platform.tsx       # WebPlatform: боевой API без префикса (/mock вкладывает свой)
│   ├── qr.ts              # QR через qrcode, динамический импорт (FE-010)
│   ├── share.ts, public-url.ts   # clipboard / share sheet / download; cardUrl() на NEXT_PUBLIC_APP_URL
│   └── auth/              # token-store (access в памяти, refresh в localStorage),
│                          # auth-provider.tsx — привязка AuthProvider из @birlinq/core
├── i18n/                  # next-intl: routing, request, navigation

apps/mobile/               # Expo SDK 57, файловый роутинг
├── app/                   # _layout.tsx (гидратация + IntlProvider + platform + auth),
│                          # index (вход), (cabinet)/ — вкладки кабинета
├── src/                   # platform.tsx, api-config.ts, token-store.ts (Keychain/Keystore)
└── tailwind.config.js     # NativeWind, тема разбирается из packages/tokens/theme.css
```

Ключевые решения:

- **JWT**: access-токен только в памяти (TTL 15 мин), refresh — в localStorage с автоматической ротацией; на 401 клиент делает один refresh и повторяет запрос. Бэкенд-доки предлагают httpOnly-cookie через BFF — можно добавить позже, заменив `token-store.ts`, call-sites не изменятся.
- **Idempotency-Key** (UUID) автоматически ставится там, где бэкенд включил middleware: activate, pause, resume, отправка сценария и `POST /entities` (создание визитки или машины; в `useCreateCard` ключ один на попытку формы и сбрасывается после успеха или 422 по полям). На `resolve` его нет — маршрут без middleware, а операция идемпотентна сама по себе.
- **Logout посессионный**: `POST /auth/logout` гасит только текущую сессию (бэкенд кладёт id refresh-токена в claim access-токена), остальные устройства остаются в системе; «выйти везде» — отдельная кнопка на `/auth/logout-all`.
- **Приватность публичной страницы**: скрытые поля бэкенд *не присылает вовсе* (не `null`). Поэтому «ключа нет» и «владелец скрыл» — один и тот же случай, и фронт никогда не выводит «скрыто» по отсутствию поля.
- **Дубликаты сценариев**: повторная отправка того же сценария тем же посетителем в окне дедупликации возвращает `202` со `status: "duplicate"` — экран благодарности показывается, но текстом «владелец уже знает».
- **Локали**: в URL ISO-код `kk`, бэкенду отправляется `kz` (`toApiLocale`). Публичные эндпоинты берут локаль только из `Accept-Language`, поэтому `scan` и `submitLead` шлют её заголовком — иначе событие скана логируется с локалью браузера, а не страницы.
- **Коды из писем**: бэкенд отправляет 64-символьный токен без ссылки, поэтому `/reset-password` и `/verify-email` принимают его в поле вручную; `?token=` в URL остаётся опциональным диплинком.
- **Лимиты полей** собраны в `packages/api/src/limits.ts` по Form Requests бэкенда — `maxLength` на инпутах, чтобы длинная вставка не стоила лишнего 422 (а на троттлящихся публичных эндпоинтах — и 429).
- **Переиспользование для мобильного приложения**: `packages/api` не знает ни адреса бэкенда, ни способа хранить сессию — и то и другое приходит через `configureApi({ baseUrl, tokenStore })`. Мобильное приложение вызывает ту же функцию с `EXPO_PUBLIC_API_URL` и хранилищем на Keychain/Keystore — внутри пакета не поменялось ничего.
- **Один кабинет на два продукта** (FE-011): продукт определяется по URL, последний открытый запоминается в `localStorage` (`birlinq.product`) только для подсветки и ссылки логотипа — `/dashboard` всегда Move, авторедиректов нет. Незалогиненный заход в кабинет ведёт на `/login?next=…` и возвращает на ту же страницу. Наклейка привязывается к визитке из её редактора (`/qr/lookup` + `/qr/activate`). Лимит визиток — настройка бэкенда (`cards.max_per_user`), фронт лишь показывает 409 `CARD_LIMIT_REACHED` со ссылкой на тарифы.
- **Визитка по ссылке грузится в браузере** (FE-014): `GET /public/c/{alias}` пишет событие `view`, дедуплицирует его по посетителю и троттлится по IP — SSR-fetch сделал бы сервер Next единственным посетителем. Поэтому метаданные страницы общие (заголовок без суффикса «· birlinq»), стоит `noindex`, JSON-LD нет; именное OG-превью появится, когда у бэкенда будет meta-эндпоинт без событий.
- **QR визитки** рисует `qrcode` в браузере (FE-010) — единственная новая runtime-зависимость, только в `apps/web` и только динамическим импортом; SVG на экране, PNG 512 px на скачивание, всегда тёмный на белом. В коде — `<NEXT_PUBLIC_APP_URL>/p/{alias}`, без локали и без `/mock`.
- **Темы визитки** — CSS-переменные `--card-*` на `<article>` самой визитки (FE-012): десять палитр в `components/card/themes.ts`, `default` ссылается на токены, остальные — hex в этом одном файле. Всё вокруг визитки (шапка, жалоба, кабинет) остаётся на нейтральных токенах.
- **Юрстраницы** (FE-013): тела документов на русском лежат в `apps/web/src/content/legal/*.ru.json` и читаются только серверным `LegalPage`; в i18n — только рамка (заголовки, «обновлено», уведомление). На KK/EN показывается тот же русский текст с `lang="ru"` и уведомлением, что юридически значима русская версия.

## Дизайн

Бренд — монограмма «bq» (b=10 синий, q=01 фиолетовый, «первый сигнал → отклик»), знак и цвета вынесены в `packages/tokens/theme.css` (@theme) и `apps/web/src/components/ui/{Logo,LogoMark}.tsx`. Тёмная тема, почти чёрный фон `#06070b`, карточки `#10131c`, брендовый акцент `#2e63e0`, вертикали лендинга Move/ID/Business подкрашены синим/фиолетовым/зелёным. Подробности и правила использования — в `CLAUDE.md` и `CONVENTIONS.md`. Inter, радиусы 16/20/24px. Все экраны mobile-first (дизайн 390–440px), адаптив до 1440px.

Фавикон, иконки PWA и иконка уведомлений генерируются из геометрии `LogoMark` одним скриптом — `node apps/web/scripts/make-icons.mjs` из корня; править PNG руками не нужно.

Осознанные отклонения от макетов:

- P1–P3 в фигме нарисованы в светло-голубой теме — приведены к тёмной дизайн-системе продукта (стиль бордов Move/*).
- Кнопки «Скачать приложение» / сторы на лендинге заменены на CTA «Оставить заявку» — приложения ещё нет.
- Загрузка фото авто — заглушка (эндпоинта загрузки нет в API).
- Форма лида на лендинге не шлёт запрос (публичный lead-эндпоинт привязан к коду QR) — помечено TODO в `LeadForm.tsx`.
- Мобильные борды ID/* — интерфейс будущей вертикали без поддержки в бэкенде; в веб не переносились. Business перенесён не с этих бордов, а из старого продукта bir-qr (бэкенд D-040…D-043, фронт FE-010…FE-014) и живёт в общем кабинете рядом с Move.
