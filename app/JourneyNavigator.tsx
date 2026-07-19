'use client';

import { useEffect, useRef, useState } from 'react';
import { Chakra_Petch } from 'next/font/google';
import { useLanguage } from './LanguageContext';
import { JOURNEY_CAMERA_WARP_EVENT, openJourneyLeadForm } from './lib/journeyNavigation';
import { trackWebsiteEvent } from './lib/analytics';

const chakraPetch = Chakra_Petch({ subsets: ['latin'], weight: '700', display: 'swap' });

const STATIONS = [
  { label: { de: 'Deine Idee', en: 'Your Idea' }, target: 'journey-start' },
  { label: { de: 'Meine Umsetzung', en: 'My Execution' }, target: 'journey-solutions', mobileTarget: 'mobile-solutions' },
  { label: { de: 'Dein Mehrwert', en: 'Your Value' }, target: 'journey-value', mobileTarget: 'mobile-journey-value' },
  { label: { de: 'Meine Referenzen', en: 'My Work' }, target: 'journey-references', mobileTarget: 'mobile-journey-references' },
  { label: { de: 'Dein Digitalpartner', en: 'Your Digital Partner' }, target: 'journey-about', mobileTarget: 'mobile-journey-about' },
  { label: { de: 'Deine Lösung', en: 'Your Solution' }, target: 'journey-contact', mobileTarget: 'mobile-journey-contact' },
];

// Dieselben normierten Positionen, an denen die Desktop-Kamera ihre sechs
// inhaltlichen Stationen zeigt. So stimmen Klickziel, sichtbarer Inhalt und
// aktive Beschriftung der rechten Navigation immer miteinander überein.
const DESKTOP_STATION_PROGRESS = [0, 26 / 55.5, 0.56, 0.7, 0.93, 1];
// Die Schwellen markieren den sichtbaren Kapitelwechsel, nicht erst den
// mathematischen Mittelpunkt der jeweiligen Kamerastation. Die DOM-Welten
// unten haben Vorrang; diese Werte überbrücken lediglich die kurzen Momente,
// in denen zwei Kapitel während einer Kamerafahrt gleichzeitig ausblenden.
const DESKTOP_ACTIVE_THRESHOLDS = [0.452, 0.515, 0.625, 0.91, 0.9748];

// Die grossen Inhaltsebenen veröffentlichen ihren echten Sichtbarkeitsstatus
// über aria-hidden. Von hinten nach vorne geprüft gewinnt bei einer weichen
// Überblendung immer das neuere Kapitel. Damit zeigt die Navigation exakt den
// Inhalt an, den die Besucherin oder der Besucher gerade tatsächlich sieht.
const DESKTOP_VISIBLE_STATIONS = [
  { index: 5, selector: '.project-cta-world' },
  { index: 4, selector: '.studio-profile-world' },
  { index: 3, selector: '.references-world' },
  { index: 2, selector: '.value-impact-world' },
];

function getVisibleDesktopStation() {
  for (const station of DESKTOP_VISIBLE_STATIONS) {
    const element = document.querySelector<HTMLElement>(station.selector);
    if (element?.getAttribute('aria-hidden') === 'false') return station.index;
  }
  return null;
}

export default function JourneyNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [travelTargetIndex, setTravelTargetIndex] = useState<number | null>(null);
  const [travelMode, setTravelMode] = useState<'fast' | 'warp' | null>(null);
  const travelTargetRef = useRef<number | null>(null);
  const cancelTravelRef = useRef<(() => void) | null>(null);
  const trackedStationsRef = useRef(new Set<number>());
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    if (trackedStationsRef.current.has(activeIndex)) return;
    trackedStationsRef.current.add(activeIndex);
    trackWebsiteEvent('journey_station_view', {
      station: STATIONS[activeIndex].target,
      metadata: { station_index: activeIndex + 1 },
    });
  }, [activeIndex]);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      if (travelTargetRef.current !== null) return;

      if (window.innerWidth > 699) {
        const journey = document.getElementById('solution-spiral');
        if (!journey) return;

        const cameraState = (window as any).__cardsCameraState;
        const scrollStart = journey.offsetTop - window.innerHeight;
        const rawProgress = (window.scrollY - scrollStart) / Math.max(1, journey.offsetHeight);
        const progress = Math.max(0, Math.min(1,
          typeof cameraState?.cameraProgress === 'number'
            ? cameraState.cameraProgress
            : rawProgress,
        ));

        const visibleStation = getVisibleDesktopStation();
        if (visibleStation !== null) {
          setActiveIndex(previous => previous === visibleStation ? previous : visibleStation);
          return;
        }

        let current = 0;
        DESKTOP_ACTIVE_THRESHOLDS.forEach((threshold, index) => {
          if (progress >= threshold) current = index + 1;
        });
        setActiveIndex(previous => previous === current ? previous : current);
        return;
      }

      const probe = window.scrollY + window.innerHeight * 0.46;
      let current = 0;
      STATIONS.forEach((station, index) => {
        const targetId = window.innerWidth <= 699 && station.mobileTarget
          ? station.mobileTarget
          : station.target;
        const element = document.getElementById(targetId);
        if (element && element.getBoundingClientRect().top + window.scrollY <= probe) current = index;
      });
      setActiveIndex(previous => previous === current ? previous : current);
    };

    const frame = () => {
      update();
      rafId = window.requestAnimationFrame(frame);
    };

    frame();
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const interruptTravel = (event: Event) => {
      if (travelTargetRef.current === null) return;
      if (event instanceof KeyboardEvent) {
        const navigationKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
        if (!navigationKeys.includes(event.key)) return;
      }
      cancelTravelRef.current?.();
    };

    window.addEventListener('wheel', interruptTravel, { passive: true });
    window.addEventListener('touchstart', interruptTravel, { passive: true });
    window.addEventListener('keydown', interruptTravel);
    return () => {
      window.removeEventListener('wheel', interruptTravel);
      window.removeEventListener('touchstart', interruptTravel);
      window.removeEventListener('keydown', interruptTravel);
      cancelTravelRef.current?.();
    };
  }, []);

  function getStationTop(index: number) {
    const station = STATIONS[index];
    if (window.innerWidth > 699 && index > 0) {
      const journey = document.getElementById('solution-spiral');
      if (journey) {
        return journey.offsetTop - window.innerHeight + journey.offsetHeight * DESKTOP_STATION_PROGRESS[index];
      }
    }

    const targetId = window.innerWidth <= 699 && station.mobileTarget
      ? station.mobileTarget
      : station.target;
    const target = document.getElementById(targetId);
    if (!target) return window.scrollY;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    return targetTop - Math.max(0, (window.innerHeight - target.offsetHeight) / 2);
  }

  function getCameraProgressForScrollTop(scrollTop: number) {
    const journey = document.getElementById('solution-spiral');
    if (!journey) return 0;
    const start = journey.offsetTop - window.innerHeight;
    const distance = window.innerWidth <= 699
      ? Math.max(1, window.innerHeight * 7.95)
      : Math.max(1, journey.offsetHeight);
    return Math.max(0, Math.min(1, (scrollTop - start) / distance));
  }

  function startAdaptiveTravel(index: number, mode: 'fast' | 'warp') {
    cancelTravelRef.current?.();
    window.scrollTo({ top: window.scrollY, behavior: 'auto' });

    const startY = window.scrollY;
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const targetY = Math.max(0, Math.min(maxY, getStationTop(index)));
    const distanceY = targetY - startY;
    const duration = mode === 'warp' ? 620 : 720;
    const bodyClass = mode === 'warp' ? 'journey-warp-active' : 'journey-fast-travel';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || Math.abs(distanceY) < 2) {
      window.scrollTo({ top: targetY, behavior: 'auto' });
      setActiveIndex(index);
      return;
    }

    let frameId = 0;
    let finishFrameOne = 0;
    let finishFrameTwo = 0;
    let cancelled = false;
    let startTime = 0;
    let warpJumped = false;

    travelTargetRef.current = index;
    setTravelTargetIndex(index);
    setTravelMode(mode);
    document.body.classList.add('journey-navigation-active', bodyClass);

    const clearTravelState = () => {
      document.body.classList.remove('journey-navigation-active', 'journey-fast-travel', 'journey-warp-active');
      travelTargetRef.current = null;
      cancelTravelRef.current = null;
      setTravelTargetIndex(null);
      setTravelMode(null);
    };

    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(finishFrameOne);
      window.cancelAnimationFrame(finishFrameTwo);
      window.scrollTo({ top: window.scrollY, behavior: 'auto' });
      clearTravelState();
    };
    cancelTravelRef.current = cancel;

    const frame = (time: number) => {
      if (cancelled) return;
      if (!startTime) startTime = time;
      const progress = Math.min(1, (time - startTime) / duration);

      if (mode === 'warp') {
        // Ein echter Stationssprung: Erst wird der Reisevorhang vollständig
        // geschlossen, dann setzen wir die Scroll-/Kameraposition in genau
        // einem Frame direkt auf das Ziel. Keine Zwischenstation wird
        // physisch durchfahren oder gerendert.
        if (!warpJumped && progress >= 0.42) {
          warpJumped = true;
          window.scrollTo({ top: targetY, behavior: 'auto' });
          window.dispatchEvent(new CustomEvent<number>(JOURNEY_CAMERA_WARP_EVENT, {
            detail: getCameraProgressForScrollTop(targetY),
          }));
          setActiveIndex(index);
        }

        if (progress < 1) {
          frameId = window.requestAnimationFrame(frame);
          return;
        }

        if (!warpJumped) {
          window.scrollTo({ top: targetY, behavior: 'auto' });
          window.dispatchEvent(new CustomEvent<number>(JOURNEY_CAMERA_WARP_EVENT, {
            detail: getCameraProgressForScrollTop(targetY),
          }));
          setActiveIndex(index);
        }
        finishFrameOne = window.requestAnimationFrame(() => {
          finishFrameTwo = window.requestAnimationFrame(clearTravelState);
        });
        return;
      }

      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo({ top: startY + distanceY * eased, behavior: 'auto' });

      if (progress < 1) {
        frameId = window.requestAnimationFrame(frame);
        return;
      }

      window.scrollTo({ top: targetY, behavior: 'auto' });
      setActiveIndex(index);
      // Zwei Frames geben Kamera und Zielkarte Zeit, ihre endgültige
      // Position zu berechnen, bevor der Reisevorhang verschwindet.
      finishFrameOne = window.requestAnimationFrame(() => {
        finishFrameTwo = window.requestAnimationFrame(clearTravelState);
      });
    };

    frameId = window.requestAnimationFrame(frame);
  }

  function goToStation(index: number) {
    trackWebsiteEvent('journey_navigation', {
      station: STATIONS[index].target,
      metadata: {
        from_station: STATIONS[activeIndex].target,
        to_station: STATIONS[index].target,
      },
    });
    if (index === STATIONS.length - 1) {
      openJourneyLeadForm('overview', { navigate: false, ctaId: 'journey_navigation_solution' });
    }

    const stationDistance = Math.abs(index - activeIndex);
    if (stationDistance >= 2) {
      startAdaptiveTravel(index, 'warp');
      return;
    }

    cancelTravelRef.current?.();
    const station = STATIONS[index];
    if (window.innerWidth > 699 && index > 0) {
      const journey = document.getElementById('solution-spiral');
      if (journey) {
        window.scrollTo({
          top: journey.offsetTop - window.innerHeight + journey.offsetHeight * DESKTOP_STATION_PROGRESS[index],
          behavior: 'smooth',
        });
        return;
      }
    }
    const targetId = window.innerWidth <= 699 && station.mobileTarget
      ? station.mobileTarget
      : station.target;
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <>
      <div
        className={`journey-travel-veil ${travelMode ? `is-${travelMode}` : ''}`}
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>
      <nav
      className={`journey-navigator ${chakraPetch.className}`}
      aria-label={lang === 'de' ? 'Seitennavigation' : 'Page navigation'}
      >
      <div className="journey-language" aria-label={lang === 'de' ? 'Sprache wählen' : 'Choose language'}>
        <button
          type="button"
          className={lang === 'de' ? 'is-active' : ''}
          aria-pressed={lang === 'de'}
          onClick={() => setLang('de')}
        >
          DE
        </button>
        <span aria-hidden="true">/</span>
        <button
          type="button"
          className={lang === 'en' ? 'is-active' : ''}
          aria-pressed={lang === 'en'}
          onClick={() => setLang('en')}
        >
          EN
        </button>
      </div>
      <span className="journey-rail" aria-hidden="true">
        <span
          className="journey-rail-progress"
          style={{ height: `${(activeIndex / (STATIONS.length - 1)) * 100}%` }}
        />
      </span>
      {STATIONS.map((station, index) => {
        const isActive = index === activeIndex;
        const isVisited = index < activeIndex;
        const isTravelTarget = index === travelTargetIndex;
        const label = station.label[lang];
        return (
          <button
            key={station.target}
            type="button"
            className={`journey-station ${isActive ? 'is-active' : ''} ${isVisited ? 'is-visited' : ''} ${isTravelTarget ? 'is-travel-target' : ''}`}
            aria-current={isActive ? 'location' : undefined}
            aria-busy={isTravelTarget || undefined}
            aria-label={lang === 'de' ? `Zu ${label}` : `Go to ${label}`}
            onClick={() => goToStation(index)}
          >
            <span className="journey-label">{label}</span>
            <span className="journey-node" aria-hidden="true">
              <span className="journey-node-core" />
            </span>
          </button>
        );
      })}
      <span className="journey-count" aria-hidden="true">
        {String(activeIndex + 1).padStart(2, '0')} / {String(STATIONS.length).padStart(2, '0')}
      </span>
      <div className="journey-utility">
        <button
          type="button"
          className="journey-utility-contact"
          onClick={() => goToStation(STATIONS.length - 1)}
        >
          {lang === 'de' ? 'Deine Lösung' : 'Your solution'}
        </button>
        <div className="journey-utility-legal">
          <a href="/datenschutz">{lang === 'de' ? 'Datenschutz' : 'Privacy'}</a>
          <span aria-hidden="true">·</span>
          <a href="/impressum">{lang === 'de' ? 'Impressum' : 'Legal notice'}</a>
        </div>
      </div>
      </nav>
    </>
  );
}
