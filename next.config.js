/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // The on-disk webpack cache repeatedly corrupts in this dev setup
      // ("Cannot find module './NNNN.js'" after a stale/partial write),
      // forcing a manual `rm -rf .next`. In-memory cache avoids that class
      // of bug entirely; dev rebuilds stay fast either way.
      config.cache = { type: 'memory' };
    }
    return config;
  },
};

export default nextConfig;

