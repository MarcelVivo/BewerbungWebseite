/** @type {import('next').NextConfig} */
const nextConfig = {
  // BrainBackground builds its Three.js scene imperatively inside a single
  // useEffect (WebGLRenderer, geometries, RAF loop). StrictMode's dev-only
  // double-invoke (mount -> cleanup -> mount) races the async
  // renderer.forceContextLoss() from the first cleanup against the second
  // mount's `new THREE.WebGLRenderer()` on the same canvas, crashing with
  // "Cannot read properties of null (reading 'precision')".
  reactStrictMode: false,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/expertise-documents/[slug]': ['./private/expertise/**/*.pdf'],
    },
  },
  async redirects() {
    return [
      {
        source: '/expertise',
        destination: '/bewerbungsprofil',
        permanent: true,
      },
    ];
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
