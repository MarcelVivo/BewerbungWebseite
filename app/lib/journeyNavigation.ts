export type JourneyDestination = 'references' | 'contact';

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
