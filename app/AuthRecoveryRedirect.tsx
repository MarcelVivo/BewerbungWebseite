'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthRecoveryRedirect() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const hash = new URLSearchParams(url.hash.slice(1));
    const isRecovery = hash.get('type') === 'recovery';

    // Some Supabase email templates fall back to SITE_URL. If a PKCE code
    // arrives on the homepage, route it through the existing server callback.
    if (window.location.pathname === '/' && code && code.length >= 20) {
      const callback = new URL('/api/auth/callback', window.location.origin);
      callback.searchParams.set('code', code);
      callback.searchParams.set('next', '/auth/passwort-zuruecksetzen');
      window.location.replace(callback.toString());
      return;
    }

    // Compatibility for older implicit recovery emails containing tokens in
    // the URL fragment. Tokens are immediately converted into a session and
    // removed from the address bar by navigating to the reset page.
    if (window.location.pathname === '/' && isRecovery) {
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      if (!accessToken || !refreshToken) return;

      const supabase = createClient();
      void supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          window.location.replace(error
            ? '/auth/passwort-zuruecksetzen?error=invalid_link'
            : '/auth/passwort-zuruecksetzen');
        });
    }
  }, []);

  return null;
}
