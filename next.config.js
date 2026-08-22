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
  outputFileTracingIncludes: {
    '/api/expertise-documents/[slug]': ['./private/expertise/**/*.pdf'],
    // The ffmpeg-static binary isn't reachable through a normal import, so
    // Next's output file tracing wouldn't otherwise know this route needs
    // it at runtime (post-processing AILA's live chat voice - see
    // app/api/aila/speech/route.ts).
    '/api/aila/speech': ['./node_modules/ffmpeg-static/ffmpeg'],
  },
  async headers() {
    // No inline-script nonce infrastructure exists yet, so Next.js's own
    // hydration/bootstrap scripts currently need 'unsafe-inline' in
    // script-src. 'unsafe-eval' is only permitted by the local dev server.
    // Everything else (frames, objects, forms, base) is locked
    // to 'self'. The public site itself makes no third-party calls, but
    // /dashboard/* pages talk to Supabase directly from the browser
    // (createBrowserClient in lib/supabase/client.ts — REST + realtime
    // websocket), so that origin has to be explicitly allowed in
    // connect-src or every dashboard data fetch gets silently blocked.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseWsUrl = supabaseUrl.replace(/^https:/, 'wss:');
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob: data:",
      "font-src 'self' data:",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl} ${supabaseWsUrl}` : ''}`,
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
    ].join('; ');

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'off' },
      { key: 'Origin-Agent-Cluster', value: '?1' },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, noarchive, nosnippet' },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, noarchive, nosnippet' },
        ],
      },
      {
        source: '/recruiter/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, noarchive, nosnippet' },
        ],
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
