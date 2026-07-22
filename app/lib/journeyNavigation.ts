import { trackWebsiteEvent } from './analytics';

export type JourneyDestination = 'start' | 'solutions' | 'value' | 'references' | 'about' | 'contact';
export type JourneyLeadForm = 'overview' | 'consultation' | 'project' | 'ki';

export const OPEN_LEAD_FORM_EVENT = 'ms:open-lead-form';
export const JOURNEY_CAMERA_WARP_EVENT = 'ms:journey-camera-warp';
export const JOURNEY_DESTINATION_WARP_EVENT = 'ms:journey-destination-warp';

export const JOURNEY_DESTINATION_HASH: Record<JourneyDestination, string> = {
  start: '#journey-start',
  solutions: '#journey-solutions',
  value: '#journey-value',
  references: '#journey-references',
  about: '#journey-about',
  contact: '#journey-contact',
};

const HASH_DESTINATION = new Map<string, JourneyDestination>([
  ...Object.entries(JOURNEY_DESTINATION_HASH).map(([destination, hash]) => [hash, destination as JourneyDestination] as const),
  ['#solution-spiral', 'solutions'],
  ['#services', 'solutions'],
  ['#references', 'references'],
  ['#portfolio', 'references'],
  ['#about', 'about'],
]);

const MOBILE_TARGET: Record<JourneyDestination, string> = {
  start: 'journey-start',
  solutions: 'mobile-solutions',
  value: 'mobile-journey-value',
  references: 'mobile-journey-references',
  about: 'mobile-journey-about',
  contact: 'mobile-journey-contact',
};

const DESKTOP_PROGRESS: Record<JourneyDestination, number> = {
  start: 0,
  solutions: 26 / 55.5,
  value: 0.56,
  references: 0.7,
  about: 0.93,
  contact: 1,
};

export function getJourneyDestinationFromHash(hash: string): JourneyDestination | null {
  return HASH_DESTINATION.get(hash.toLowerCase()) ?? null;
}

export function getJourneyHref(destination: JourneyDestination) {
  return `/${JOURNEY_DESTINATION_HASH[destination]}`;
}

export function isJourneyHome() {
  return window.location.pathname === '/';
}

/**
 * Zentrale Navigation für Buttons und Links innerhalb der öffentlichen
 * Website. Auf der Startseite übernimmt der JourneyNavigator den exakten
 * Mobile-/Desktop-Sprung. Von Unterseiten wird zuerst zur kanonischen
 * Startseiten-URL gewechselt; der Hash wird dort nach der Hydration auf das
 * tatsächlich sichtbare Mobile- oder Desktop-Ziel aufgelöst.
 */
export function navigateToJourneyDestination(destination: JourneyDestination) {
  if (!isJourneyHome()) {
    window.location.assign(getJourneyHref(destination));
    return;
  }

  window.dispatchEvent(new CustomEvent<JourneyDestination>(JOURNEY_DESTINATION_WARP_EVENT, {
    detail: destination,
  }));
}

/** Rückwärtskompatibler Name für bestehende CTA-Aufrufe. */
export function scrollToJourneyDestination(destination: JourneyDestination) {
  navigateToJourneyDestination(destination);
}

/** Direkter Fallback, falls der JourneyNavigator noch nicht hydriert ist. */
export function resolveJourneyPosition(destination: JourneyDestination, behavior: ScrollBehavior = 'auto') {
  if (window.innerWidth <= 699) {
    document.getElementById(MOBILE_TARGET[destination])?.scrollIntoView({ behavior, block: 'start' });
    return;
  }

  if (destination === 'start') {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  const journey = document.getElementById('solution-spiral');
  if (!journey) return;
  window.scrollTo({
    top: journey.offsetTop - window.innerHeight + journey.offsetHeight * DESKTOP_PROGRESS[destination],
    behavior,
  });
}

export function openJourneyLeadForm(
  form: JourneyLeadForm = 'overview',
  options: { navigate?: boolean; ctaId?: string; travel?: 'smooth' | 'warp' } = {},
) {
  if (options.ctaId) {
    trackWebsiteEvent('cta_click', { ctaId: options.ctaId });
  }
  if (form !== 'overview') {
    trackWebsiteEvent('form_open', { formId: form });
  }

  if (options.navigate !== false && !isJourneyHome()) {
    window.location.assign(`/?lead=${encodeURIComponent(form)}${JOURNEY_DESTINATION_HASH.contact}`);
    return;
  }

  window.dispatchEvent(new CustomEvent<JourneyLeadForm>(OPEN_LEAD_FORM_EVENT, { detail: form }));
  if (options.navigate === false) return;

  if (options.travel === 'smooth') {
    resolveJourneyPosition('contact', 'smooth');
    return;
  }
  navigateToJourneyDestination('contact');
}
