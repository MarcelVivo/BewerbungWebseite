'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Next.js replaces the ENTIRE root layout with this on an uncaught render
// error, which is why it needs its own <html>/<body> - there's no shared
// layout to fall back on at this point.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body style={{
        display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '1rem', background: '#0b0b0d', color: '#f4efe6',
        fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '2rem',
      }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Etwas ist schiefgelaufen.</h1>
        <p style={{ opacity: 0.7, maxWidth: '28rem' }}>
          Der Fehler wurde automatisch gemeldet. Bitte lade die Seite neu.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '.6rem 1.4rem', borderRadius: '999px', border: '1px solid rgba(244,239,230,.3)',
            background: 'transparent', color: 'inherit', cursor: 'pointer',
          }}
        >
          Seite neu laden
        </button>
      </body>
    </html>
  );
}
