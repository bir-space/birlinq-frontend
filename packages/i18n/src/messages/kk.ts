import commonMessages from "../../messages/kk/common.json";
import landingMessages from "../../messages/kk/landing.json";
import publicMessages from "../../messages/kk/public.json";
import authMessages from "../../messages/kk/auth.json";
import activationMessages from "../../messages/kk/activation.json";
import dashboardMessages from "../../messages/kk/dashboard.json";
import guideMessages from "../../messages/kk/guide.json";
import mockMessages from "../../messages/kk/mock.json";

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
