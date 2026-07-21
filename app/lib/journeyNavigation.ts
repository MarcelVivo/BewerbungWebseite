import { trackWebsiteEvent } from './analytics';

export type JourneyDestination = 'references' | 'contact';
export type JourneyLeadForm = 'overview' | 'consultation' | 'project' | 'ki';

export const OPEN_LEAD_FORM_EVENT = 'ms:open-lead-form';
export const JOURNEY_CAMERA_WARP_EVENT = 'ms:journey-camera-warp';
export const JOURNEY_DESTINATION_WARP_EVENT = 'ms:journey-destination-warp';

const DESKTOP_PROGRESS: Record<JourneyDestination, number> = {
  references: 0.7,
  contact: 1,
};

const MOBILE_TARGET: Record<JourneyDestination, string> = {
  references: 'mobile-journey-references',
  contact: 'mobile-journey-contact',
};

export function scrollToJourneyDestination(destination: JourneyDestination) {
  if (window.innerWidth <= 699) {
    document.getElementById(MOBILE_TARGET[destination])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const journey = document.getElementById('solution-spiral');
  if (!journey) return;
  window.scrollTo({
    top: journey.offsetTop - window.innerHeight + journey.offsetHeight * DESKTOP_PROGRESS[destination],
    behavior: 'smooth',
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
  window.dispatchEvent(new CustomEvent<JourneyLeadForm>(OPEN_LEAD_FORM_EVENT, { detail: form }));
  if (options.navigate === false) return;
  if (options.travel === 'warp') {
    window.dispatchEvent(new CustomEvent<JourneyDestination>(JOURNEY_DESTINATION_WARP_EVENT, {
      detail: 'contact',
    }));
    return;
  }
  scrollToJourneyDestination('contact');
}
