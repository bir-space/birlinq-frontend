import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship as TypeScript source, so Next compiles them itself.
  transpilePackages: ["@birlinq/api", "@birlinq/core", "@birlinq/i18n", "@birlinq/platform"],
};

export default withNextIntl(nextConfig);
