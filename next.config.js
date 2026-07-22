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
      // Legacy targets used in KI-check emails. Keep these redirects so links
      // in reports that have already been delivered continue to work.
      {
        source: '/leistungen/ki-beratung-kmu',
        destination: '/leistungen/analyse-konzept',
        permanent: true,
      },
      {
        source: '/leistungen/workshops',
        destination: '/leistungen/automatisierung-ki-agenten',
        permanent: true,
      },
      {
        source: '/leistungen/ki-agenten',
        destination: '/leistungen/automatisierung-ki-agenten',
        permanent: true,
      },
      {
        source: '/leistungen/prozessoptimierung',
        destination: '/leistungen/erp-prozesse',
        permanent: true,
      },
      {
        source: '/leistungen/digital-marketing',
        destination: '/leistungen/corporate-design',
        permanent: true,
      },
      {
        source: '/leistungen/business-analyse',
        destination: '/leistungen/analyse-konzept',
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
