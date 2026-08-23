import * as Sentry from '@sentry/nextjs';

// All app/api/aila/* routes run on the nodejs runtime (confirmed via
// `export const runtime = 'nodejs'` in each), so no edge config is needed
// here - if an edge route is ever added, a sentry.edge.config.ts plus an
// `if (process.env.NEXT_RUNTIME === 'edge')` branch would need to follow.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
