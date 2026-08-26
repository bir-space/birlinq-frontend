import commonMessages from "../../messages/en/common.json";
import landingMessages from "../../messages/en/landing.json";
import publicMessages from "../../messages/en/public.json";
import authMessages from "../../messages/en/auth.json";
import activationMessages from "../../messages/en/activation.json";
import dashboardMessages from "../../messages/en/dashboard.json";
import guideMessages from "../../messages/en/guide.json";
import mockMessages from "../../messages/en/mock.json";

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
