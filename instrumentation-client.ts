import * as Sentry from '@sentry/nextjs';

// Modern replacement for sentry.client.config.ts (the SDK deprecates that
// file and it doesn't work under Turbopack at all) - see
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
