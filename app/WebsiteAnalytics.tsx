'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackWebsiteEvent } from './lib/analytics';

const PRIVATE_PREFIXES = ['/dashboard', '/login', '/recruiter', '/expertise', '/projects'];

export default function WebsiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || PRIVATE_PREFIXES.some(prefix => pathname.startsWith(prefix))) return;
    const startedAt = performance.now();
    let exited = false;

    trackWebsiteEvent('page_view');

    const trackExit = () => {
      if (exited) return;
      exited = true;
      trackWebsiteEvent('page_exit', {
        metadata: { duration_seconds: Math.round((performance.now() - startedAt) / 1000) },
      }, { beacon: true });
    };

    window.addEventListener('pagehide', trackExit);
    return () => {
      window.removeEventListener('pagehide', trackExit);
      trackExit();
    };
  }, [pathname]);

  return null;
}
