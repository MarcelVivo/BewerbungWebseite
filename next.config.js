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
  async headers() {
    // No inline-script nonce infrastructure exists yet, so Next.js's own
    // hydration/bootstrap scripts need 'unsafe-inline'/'unsafe-eval' in
    // script-src. Everything else (frames, objects, forms, base) is locked
    // to 'self' — the site loads no third-party scripts, iframes, or
    // browser-side calls to Supabase (all Supabase access happens server-
    // side in API routes / middleware), so this is not a meaningful
    // loosening in practice.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
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
