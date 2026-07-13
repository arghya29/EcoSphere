/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  optimizeFonts: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.tile.openstreetmap.org' },
    ],
  },
  eslint: {
    // Linting is run separately in CI; don't block production builds on it.
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
