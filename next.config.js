/** @type {import('next').NextConfig} */

let envWarningShown = false;

const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.tile.openstreetmap.org' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config, { dev }) => {
    if (dev && !envWarningShown) {
      try {
        const { validateEnvironment } = require('./lib/env');
        const result = validateEnvironment();
        if (!result.valid) {
          console.warn('\n Environment variable check:');
          result.missing.forEach((v) => console.warn(`   MISSING: ${v}`));
          console.warn(' Run `npm run validate:env` for details.\n');
        }
        if (result.warnings.length > 0) {
          console.info('\n Optional env var warnings:');
          result.warnings.forEach((w) => console.info(`   ${w}`));
          console.info();
        }
      } catch {
        // lib/env might not be resolvable at webpack config time
      }
      envWarningShown = true;
    }
    return config;
  },
};

const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

module.exports = withNextIntl(nextConfig);
