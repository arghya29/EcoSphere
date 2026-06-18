/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
