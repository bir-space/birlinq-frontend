/**
 * Static fixture data for the /mock preview pages. Shapes must stay in sync
 * with `@birlinq/api` types — this is what the mock API layer
 * (mock-endpoints.ts) serves instead of a live backend response.
 *
 * These mirror the REAL backend contract (car/personal entity types,
 * vehicle_profile, license_plate, the 17 privacy flags, `alias` on every
 * entity) so the mock pages stay a faithful preview rather than drifting into
 * a shape the API never returns.
 */
import type {
  ContactProfile,
  DailyStat,
  Entity,
  EntityStats,
  Interaction,
  OwnerDashboard,
  PrivacySettings,
  PublicEntityPayload,
  PublicScenario,
  QrCode,
  User,
} from "@birlinq/api";

export const MOCK_USER: User = {
  id: "user-mock-1",
  name: "Айгерим Сатпаева",
  email: "aigerim@example.com",
  phone: "77011234567",
  locale: "ru",
  email_verified_at: "2025-11-01T10:02:00Z",
  privacy_accepted_at: "2025-11-01T09:58:00Z",
  avatar_url: null,
  created_at: "2025-11-01T09:58:00Z",
};

/** Matches Entity::booted() on the backend — everything personal hidden. */
export const DEFAULT_MOCK_PRIVACY: PrivacySettings = {
  show_year: true,
  show_license_plate: false,
  show_display_name: false,
  show_phone: false,
  show_phone2: false,
  show_email: false,
  show_whatsapp: false,
  show_telegram: false,
  show_linkedin: false,
  show_instagram: false,
  show_website: false,
  show_company: false,
  show_title: false,
  show_bio: false,
  show_birthday: false,
  show_socials: false,
  show_tags: false,
};

export const MOCK_PRIVACY_ENTITY_1: PrivacySettings = {
  ...DEFAULT_MOCK_PRIVACY,
  show_whatsapp: true,
  show_telegram: true,
};

export const MOCK_PRIVACY_ENTITY_2: PrivacySettings = {
  ...DEFAULT_MOCK_PRIVACY,
  show_license_plate: true,
  show_display_name: true,
  show_phone: true,
  show_whatsapp: true,
  show_telegram: true,
};

/**
 * The `card` preset of `@birlinq/core` (who you are + the professional
 * channels, messengers off) — what a new business card starts with.
 */
export const MOCK_CARD_PRESET_PRIVACY: PrivacySettings = {
  ...DEFAULT_MOCK_PRIVACY,
  show_display_name: true,
  show_title: true,
  show_company: true,
  show_bio: true,
  show_tags: true,
  show_socials: true,
  show_website: true,
  show_linkedin: true,
  show_instagram: true,
  show_email: true,
};

/** The demo card: the preset plus the phone — same as the backend's DemoCardSeeder. */
export const MOCK_CARD_PRIVACY: PrivacySettings = {
  ...MOCK_CARD_PRESET_PRIVACY,
  show_phone: true,
};

/**
 * A contact profile with nothing filled in — what the backend hands back
 * right after `PUT /entities/{id}/contact` with an empty body. The mock
 * spreads request bodies over it so the result always has every column.
 */
export const EMPTY_CONTACT_PROFILE: ContactProfile = {
  display_name: null,
  phone: null,
  phone2: null,
  email: null,
  whatsapp: null,
  telegram: null,
  linkedin: null,
  instagram: null,
  website: null,
  company: null,
  title: null,
  bio: null,
  photo_url: null,
  cover_url: null,
  theme: "default",
  tags: null,
  date_of_birth: null,
  socials: null,
};

/**
 * The demo business card — alias `demo`, the persona of the old product,
 * identical to the backend's DemoCardSeeder so the landing's "see an
 * example" link previews the same card with and without a backend. `demo`
 * predates D-044 and keeps its shape, as every earlier address does. No
 * images: a hotlinked photo would expire, and null shows the initials path.
 */
export const MOCK_CARD_FULL: Entity = {
  id: "entity-3",
  type: "personal",
  title: null,
  status: "active",
  alias: "demo",
  privacy_settings: MOCK_CARD_PRIVACY,
  vehicle_profile: null,
  contact_profile: {
    display_name: "Ilyas Zhantureyev",
    phone: "+77057774577",
    phone2: null,
    email: "ilyas@bir.space",
    whatsapp: null,
    telegram: null,
    linkedin: null,
    instagram: null,
    website: "https://qr.b1r.space",
    company: "bir.space",
    title: "BeeKeeper",
    bio: "Специализируюсь на создании цифровых решений для бизнеса.",
    photo_url: null,
    cover_url: null,
    theme: "premium",
    tags: [
      "Web Development",
      "Design",
      "Consulting",
      "Innovation",
      "Digital Marketing",
    ],
    date_of_birth: "1990-05-14",
    socials: [
      { platform: "facebook", url: "https://facebook.com/birspace" },
      { platform: "github", url: "https://github.com/birspace" },
      { platform: "youtube", url: "https://youtube.com/@birspace" },
    ],
  },
  created_at: "2026-05-02T09:40:00Z",
  updated_at: "2026-09-20T11:15:00Z",
};

/** A second card, hidden by its owner — the 410 screen at `/p/k7m2p9xq`. */
export const MOCK_CARD_MIN: Entity = {
  id: "entity-4",
  type: "personal",
  title: null,
  status: "deactivated",
  alias: "k7m2p9xq",
  privacy_settings: MOCK_CARD_PRESET_PRIVACY,
  vehicle_profile: null,
  contact_profile: {
    ...EMPTY_CONTACT_PROFILE,
    display_name: "Айгерим Сатпаева",
    title: "Дизайнер",
  },
  created_at: "2026-08-14T13:05:00Z",
  updated_at: "2026-08-14T13:05:00Z",
};

/**
 * A card held by moderation (D-042): the editor's read-only publish state,
 * the 409 ENTITY_BLOCKED on a status change and the "blocked" screen at
 * `/p/h3k9dn4y` are all reachable without a backend.
 */
export const MOCK_CARD_BLOCKED: Entity = {
  id: "entity-5",
  type: "personal",
  title: null,
  status: "blocked",
  alias: "h3k9dn4y",
  privacy_settings: MOCK_CARD_PRESET_PRIVACY,
  vehicle_profile: null,
  contact_profile: {
    ...EMPTY_CONTACT_PROFILE,
    display_name: "Данияр Ахметов",
    title: "Менеджер по продажам",
    company: "ТОО «Пример»",
    theme: "ocean",
  },
  created_at: "2026-09-01T08:30:00Z",
  updated_at: "2026-09-25T17:45:00Z",
};

export const MOCK_ENTITIES: Entity[] = [
  {
    id: "entity-1",
    type: "car",
    title: "Мой Camry",
    status: "active",
    alias: null,
    privacy_settings: MOCK_PRIVACY_ENTITY_1,
    vehicle_profile: {
      make: "Toyota",
      model: "Camry",
      year: 2019,
      color: "Белый",
      license_plate: "123ABC02",
      photo_url: null,
    },
    contact_profile: null,
    created_at: "2025-11-05T09:00:00Z",
    updated_at: "2026-06-01T12:00:00Z",
  },
  {
    id: "entity-2",
    type: "car",
    title: null,
    status: "active",
    alias: null,
    privacy_settings: MOCK_PRIVACY_ENTITY_2,
    vehicle_profile: {
      make: "Hyundai",
      model: "Tucson",
      year: null,
      color: "Серый",
      license_plate: null,
      photo_url: null,
    },
    contact_profile: null,
    created_at: "2026-02-18T14:20:00Z",
    updated_at: "2026-02-18T14:20:00Z",
  },
  MOCK_CARD_FULL,
  MOCK_CARD_MIN,
  MOCK_CARD_BLOCKED,
];

export const MOCK_QR_CODES: QrCode[] = [
  {
    id: "qr-1",
    code: "AB12CD34",
    status: "activated",
    entity_id: "entity-1",
    activated_at: "2025-11-05T09:05:00Z",
    last_scan_at: "2026-07-28T07:40:00Z",
    scan_count: 42,
  },
  {
    id: "qr-2",
    code: "EF56GH78",
    status: "paused",
    entity_id: "entity-2",
    activated_at: "2026-02-18T14:25:00Z",
    last_scan_at: "2026-07-20T18:10:00Z",
    scan_count: 6,
  },
  {
    id: "qr-3",
    code: "IJ90KL12",
    status: "available",
    entity_id: null,
    activated_at: null,
    last_scan_at: null,
    scan_count: 0,
  },
  /** The sticker on the demo card — `/q/PERS1234` shows the card through the QR door. */
  {
    id: "qr-4",
    code: "PERS1234",
    status: "activated",
    entity_id: "entity-3",
    activated_at: "2026-05-02T10:00:00Z",
    last_scan_at: "2026-09-26T16:20:00Z",
    scan_count: 38,
  },
];

export const MOCK_INTERACTIONS: Interaction[] = [
  {
    id: "int-1",
    qr_code_id: "qr-1",
    scenario_code: "car_blocking",
    message: "Вы блокируете мою машину, не могли бы подойти и переставить?",
    status: "new",
    created_at: "2026-07-28T08:55:00Z",
  },
  {
    id: "int-2",
    qr_code_id: "qr-1",
    scenario_code: "lights_on",
    message: "У вас включены фары, машина может разрядиться.",
    status: "new",
    created_at: "2026-07-28T06:10:00Z",
  },
  {
    id: "int-3",
    qr_code_id: "qr-2",
    scenario_code: "window_open",
    message: "Окно приоткрыто, на улице начался дождь.",
    status: "resolved",
    created_at: "2026-07-27T15:30:00Z",
  },
  {
    id: "int-4",
    qr_code_id: "qr-1",
    scenario_code: "free_message",
    message: "Спасибо за наклейку, очень удобная штука!",
    status: "resolved",
    created_at: "2026-07-26T11:05:00Z",
  },
  {
    id: "int-5",
    qr_code_id: "qr-2",
    scenario_code: "other",
    message: "asdkjaslkdj買って一括見積もりhttp://spam.example",
    status: "spam",
    created_at: "2026-07-24T09:45:00Z",
  },
];

export const MOCK_DASHBOARD: OwnerDashboard = {
  total_qrs: 4,
  active_qrs: 2,
  scans_7d: 18,
  scans_30d: 64,
  submissions_7d: 5,
  unresolved_interactions: 2,
};

export const MOCK_PUBLIC_PAYLOAD: PublicEntityPayload = {
  entity: {
    type: "car",
    vehicle: {
      make: "Toyota",
      model: "Camry",
      year: 2019,
      color: "Белый",
      license_plate: "123ABC02",
    },
  },
  scenarios: [
    {
      id: "scenario-1",
      code: "car_blocking",
      title: "Вы блокируете проезд",
      description: "Попросить владельца переставить машину",
      icon: "block",
      prefilled_message:
        "Здравствуйте! Вы блокируете выезд, не могли бы переставить машину?",
    },
    {
      id: "scenario-2",
      code: "lights_on",
      title: "Забыли выключить фары",
      icon: "light",
    },
    {
      id: "scenario-3",
      code: "window_open",
      title: "Открыто окно",
      icon: "window",
    },
    {
      id: "scenario-4",
      code: "free_message",
      title: "Другое",
      icon: "chat",
    },
  ],
  meta: { locale: "ru", privacy_badge: true, source: "qr" },
};

/**
 * The scenarios a `personal` entity carries behind its sticker. The link
 * door renders none — submissions exist only under `/public/q/{code}`.
 */
export const MOCK_CARD_SCENARIOS: PublicScenario[] = [
  {
    id: "scenario-10",
    code: "free_message",
    title: "Написать сообщение",
    description: "Владелец получит его в кабинете и на почту",
    icon: "chat",
  },
];

/**
 * `GET /public/c/demo` as the backend's PrivacyFilter produces it from
 * `MOCK_CARD_FULL`: every key of `MOCK_CARD_PRIVACY` that is on and filled,
 * `theme` always, and nothing else — no birthday, no messengers, no images.
 * The mock endpoint derives the live payload the same way; this constant
 * is the reference shape.
 */
export const MOCK_CARD_PUBLIC_PAYLOAD: PublicEntityPayload = {
  entity: {
    type: "personal",
    title: null,
    alias: "demo",
    contact: {
      theme: "premium",
      display_name: "Ilyas Zhantureyev",
      phone: "+77057774577",
      email: "ilyas@bir.space",
      website: "https://qr.b1r.space",
      company: "bir.space",
      title: "BeeKeeper",
      bio: "Специализируюсь на создании цифровых решений для бизнеса.",
      tags: [
        "Web Development",
        "Design",
        "Consulting",
        "Innovation",
        "Digital Marketing",
      ],
      socials: [
        { platform: "facebook", url: "https://facebook.com/birspace" },
        { platform: "github", url: "https://github.com/birspace" },
        { platform: "youtube", url: "https://youtube.com/@birspace" },
      ],
    },
  },
  scenarios: [],
  meta: { locale: "ru", privacy_badge: true, source: "link" },
};

function ymd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Thirty buckets ending today, oldest first, with a deterministic wobble. */
function demoDaily(): DailyStat[] {
  return Array.from({ length: 30 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (29 - i));
    const views = 2 + ((i * 7) % 9) + (i % 5 === 0 ? 6 : 0);
    const clicks = Math.floor(views / 3) + (i % 4 === 0 ? 1 : 0);
    return { date: ymd(day), views, clicks };
  });
}

function demoStats(): EntityStats {
  const daily = demoDaily();
  const views30 = daily.reduce((sum, d) => sum + d.views, 0);
  const views7 = daily.slice(-7).reduce((sum, d) => sum + d.views, 0);
  const clicks30 = daily.reduce((sum, d) => sum + d.clicks, 0);
  const phone = Math.round(clicks30 * 0.45);
  const website = Math.round(clicks30 * 0.25);
  const email = Math.round(clicks30 * 0.12);
  const github = Math.round(clicks30 * 0.1);
  const youtube = clicks30 - phone - website - email - github;
  const lastView = new Date();
  lastView.setHours(lastView.getHours() - 3);
  return {
    views_total: views30 + 214,
    views_7d: views7,
    views_30d: views30,
    views_30d_by_source: { qr: 38, link: views30 - 38 },
    unique_visitors_30d: Math.round(views30 * 0.7),
    clicks_total: clicks30 + 96,
    clicks_30d: clicks30,
    clicks_30d_by_channel: {
      phone,
      website,
      email,
      "social:github": github,
      "social:youtube": youtube,
    },
    vcard_downloads_total: 47,
    vcard_downloads_30d: 12,
    shares_total: 31,
    shares_30d: 9,
    last_view_at: lastView.toISOString(),
    referrers_30d: [
      { host: "t.me", views: 41 },
      { host: "instagram.com", views: 27 },
      { host: "linkedin.com", views: 14 },
      { host: "bir.space", views: 6 },
    ],
    daily,
  };
}

/** `GET /entities/entity-3/stats` — thirty days of the demo card. */
export const MOCK_CARD_STATS: EntityStats = demoStats();
