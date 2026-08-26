import commonMessages from "../../messages/ru/common.json";
import landingMessages from "../../messages/ru/landing.json";
import publicMessages from "../../messages/ru/public.json";
import authMessages from "../../messages/ru/auth.json";
import activationMessages from "../../messages/ru/activation.json";
import dashboardMessages from "../../messages/ru/dashboard.json";
import guideMessages from "../../messages/ru/guide.json";
import mockMessages from "../../messages/ru/mock.json";

/**
 * Static imports on purpose: Metro rejects a template-literal `import()`, so a
 * loader built on interpolated paths works in webpack and fails on device.
 * Listing them also makes a missing namespace a type error rather than a
 * runtime lookup that silently returns nothing.
 *
 * The names are suffixed because some namespaces ("public") are reserved words.
 */
export default {
  common: commonMessages,
  landing: landingMessages,
  public: publicMessages,
  auth: authMessages,
  activation: activationMessages,
  dashboard: dashboardMessages,
  guide: guideMessages,
  mock: mockMessages,
};
