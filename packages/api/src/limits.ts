/**
 * Field limits mirrored from the backend Form Requests
 * (`app/Http/Requests/Api/V1/**`). One place, so a form never has to guess.
 *
 * These are `maxLength` on the inputs, not a second validation layer: the
 * backend is the authority and answers 422 either way. The point is that a
 * pasted-in overlong value gets clipped as it is typed instead of costing the
 * user a round trip — which matters most on the throttled public endpoints,
 * where the retry after a 422 can run into a 429.
 */

export const LIMITS = {
  // Auth/RegisterRequest, LoginRequest, ResetPasswordRequest
  name: 100,
  email: 255,
  password: 100,
  /** ResetPasswordRequest / RegisterRequest agree on this floor. */
  passwordMin: 8,
  token: 255,

  // Entity/UpsertVehicleProfileRequest
  vehicleMake: 100,
  vehicleModel: 100,
  vehicleColor: 50,
  licensePlate: 20,
  vehicleYearMin: 1900,
  vehicleYearMax: 2100,

  // Entity/CreateEntityRequest + UpdateEntityRequest
  entityTitle: 255,

  // Entity/UpsertContactProfileRequest
  contactDisplayName: 100,
  contactPhone: 30,
  contactTelegram: 100,
  contactCompany: 100,
  contactTitle: 100,
  contactBio: 2000,
  photoUrl: 500,

  // PublicScan/SubmitScenarioRequest
  scenarioMessage: 500,

  // PublicScan/SubmitLeadRequest
  leadName: 100,
  leadContact: 100,
  leadCity: 100,

  // PublicScan/ReportAbuseRequest
  abuseNote: 500,

  // Qr/LookupQrRequest + ActivateQrRequest
  qrCodeMin: 6,
  qrCodeMax: 24,
  activationToken: 128,

  // Owner/ListInteractionsRequest
  interactionsLimitMax: 100,
} as const;
