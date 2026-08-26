/**
 * Static fixture data for the /mock preview pages. Shapes must stay in sync
 * with src/lib/api/types.ts — this is what the mock API layer (mock-endpoints.ts)
 * serves instead of a live backend response.
 *
 * These mirror the REAL backend contract (car/personal entity types,
 * vehicle_profile, license_plate, the 10 privacy flags) so the mock pages stay
 * a faithful preview rather than drifting into a shape the API never returns.
 */
import type {
  Entity,
  Interaction,
  OwnerDashboard,
  PrivacySettings,
  PublicEntityPayload,
  QrCode,
  User,
} from "@birlinq/api";

export const MOCK_USER: User = {
  id: "user-mock-1",
  name: "Айгерим Сатпаева",
  email: "aigerim@example.com",
  phone: "77011234567",
  locale: "ru",
};

export const MOCK_PRIVACY_ENTITY_1: PrivacySettings = {
  show_year: true,
  show_license_plate: false,
  show_display_name: false,
  show_phone: false,
  show_phone2: false,
  show_email: false,
  show_whatsapp: true,
  show_telegram: true,
  show_company: false,
  show_bio: false,
};

export const MOCK_PRIVACY_ENTITY_2: PrivacySettings = {
  show_year: true,
  show_license_plate: true,
  show_display_name: true,
  show_phone: true,
  show_phone2: false,
  show_email: false,
  show_whatsapp: true,
  show_telegram: true,
  show_company: false,
  show_bio: false,
};

/** Matches Entity::booted() on the backend. */
export const DEFAULT_MOCK_PRIVACY: PrivacySettings = {
  show_year: true,
  show_license_plate: false,
  show_display_name: false,
  show_phone: false,
  show_phone2: false,
  show_email: false,
  show_whatsapp: false,
  show_telegram: false,
  show_company: false,
  show_bio: false,
};

export const MOCK_ENTITIES: Entity[] = [
  {
    id: "entity-1",
    type: "car",
    title: "Мой Camry",
    status: "active",
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
  total_qrs: 3,
  active_qrs: 1,
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
  meta: { locale: "ru", privacy_badge: true },
};
