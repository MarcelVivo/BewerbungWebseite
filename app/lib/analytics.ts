'use client';

export type WebsiteEventName =
  | 'page_view'
  | 'page_exit'
  | 'journey_station_view'
  | 'journey_navigation'
  | 'cta_click'
  | 'form_open'
  | 'form_start'
  | 'form_step'
  | 'form_submit'
  | 'form_success'
  | 'form_error';

export type WebsiteFormId = 'consultation' | 'project' | 'ki';

type EventProperties = {
  station?: string;
  formId?: WebsiteFormId;
  ctaId?: string;
  step?: number;
  metadata?: Record<string, string | number | boolean | null>;
};

let visitId: string | null = null;
let sequence = 0;

function trackingIsAllowed() {
  if (typeof window === 'undefined') return false;
  const privacyNavigator = navigator as Navigator & { globalPrivacyControl?: boolean };
  return privacyNavigator.globalPrivacyControl !== true && navigator.doNotTrack !== '1';
}

function getVisitId() {
  if (!visitId) visitId = crypto.randomUUID();
  return visitId;
}

function trim(value: string | null | undefined, max = 160) {
  return value?.trim().slice(0, max) || null;
}

function sourceContext() {
  const params = new URLSearchParams(window.location.search);
  let referrerHost: string | null = null;
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname : null;
  } catch {
    referrerHost = null;
  }

  return {
    source: trim(params.get('utm_source')),
    medium: trim(params.get('utm_medium')),
    campaign: trim(params.get('utm_campaign')),
    referrerHost: trim(referrerHost),
  };
}

export function trackWebsiteEvent(
  eventName: WebsiteEventName,
  properties: EventProperties = {},
  options: { beacon?: boolean } = {},
) {
  if (!trackingIsAllowed()) return;

  const payload = JSON.stringify({
    eventName,
    visitId: getVisitId(),
    sequence: ++sequence,
    pagePath: window.location.pathname,
    language: document.documentElement.lang === 'en' ? 'en' : 'de',
    ...sourceContext(),
    station: trim(properties.station, 80),
    formId: properties.formId ?? null,
    ctaId: trim(properties.ctaId, 100),
    step: typeof properties.step === 'number' ? properties.step : null,
    metadata: properties.metadata ?? {},
  });

  if (options.beacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', new Blob([payload], { type: 'application/json' }));
    return;
  }

  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt the public experience.
  });
}

