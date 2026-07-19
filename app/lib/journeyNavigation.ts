export type JourneyDestination = 'references' | 'contact';
export type JourneyLeadForm = 'overview' | 'consultation' | 'project' | 'ki';

export const OPEN_LEAD_FORM_EVENT = 'ms:open-lead-form';

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

export function openJourneyLeadForm(form: JourneyLeadForm = 'overview') {
  window.dispatchEvent(new CustomEvent<JourneyLeadForm>(OPEN_LEAD_FORM_EVENT, { detail: form }));
  scrollToJourneyDestination('contact');
}
