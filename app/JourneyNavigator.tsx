'use client';

import { useEffect, useRef, useState } from 'react';
import { Chakra_Petch } from 'next/font/google';
import { ChevronLeft, ChevronRight, List, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import {
  getJourneyDestinationFromHash,
  JOURNEY_DESTINATION_HASH,
  JOURNEY_CAMERA_WARP_EVENT,
  JOURNEY_DESTINATION_WARP_EVENT,
  openJourneyLeadForm,
  type JourneyDestination,
} from './lib/journeyNavigation';
import { trackWebsiteEvent } from './lib/analytics';

const chakraPetch = Chakra_Petch({ subsets: ['latin'], weight: '700', display: 'swap' });

const STATIONS = [
  { destination: 'start', label: { de: 'Start', en: 'Start' }, target: 'journey-start' },
  { destination: 'solutions', label: { de: 'Meine Umsetzung', en: 'My Execution' }, target: 'journey-solutions', mobileTarget: 'mobile-solutions' },
  { destination: 'value', label: { de: 'Dein Mehrwert', en: 'Your Value' }, target: 'journey-value', mobileTarget: 'mobile-journey-value' },
  { destination: 'references', label: { de: 'Meine Referenzen', en: 'My Work' }, target: 'journey-references', mobileTarget: 'mobile-journey-references' },
  { destination: 'about', label: { de: 'Dein Digitalpartner', en: 'Your Digital Partner' }, target: 'journey-about', mobileTarget: 'mobile-journey-about' },
  { destination: 'contact', label: { de: 'Dein Projekt', en: 'Your Project' }, target: 'journey-contact', mobileTarget: 'mobile-journey-contact' },
] satisfies Array<{
  destination: JourneyDestination;
  label: { de: string; en: string };
  target: string;
  mobileTarget?: string;
}>;

const STATION_INDEX = new Map<JourneyDestination, number>(
  STATIONS.map((station, index) => [station.destination, index]),
);

export default function JourneyNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [travelTargetIndex, setTravelTargetIndex] = useState<number | null>(null);
  const [travelMode, setTravelMode] = useState<'fast' | 'warp' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const travelTargetRef = useRef<number | null>(null);
  const cancelTravelRef = useRef<(() => void) | null>(null);
  const trackedStationsRef = useRef(new Set<number>());
  const historyNavigationFrameRef = useRef(0);
  const mobileNavigationFrameRef = useRef(0);
  const initialHistoryResolvedRef = useRef(false);
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

  // Manuelles Scrollen ersetzt nur den aktuellen History-Eintrag. Verlässt
  // man danach eine Karte, führt Browser-Zurück dadurch exakt zu der Station,
  // die zuvor sichtbar war, ohne für jeden Scrollpixel History anzulegen.
  useEffect(() => {
    if (!initialHistoryResolvedRef.current || window.location.pathname !== '/' || travelTargetRef.current !== null) return;
    const destination = STATIONS[activeIndex].destination;
    const hash = JOURNEY_DESTINATION_HASH[destination];
    if (window.location.hash === hash) return;
    window.history.replaceState(
      { ...(window.history.state ?? {}), journeyDestination: destination },
      '',
      hash,
    );
  }, [activeIndex]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

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
      window.cancelAnimationFrame(mobileNavigationFrameRef.current);
      cancelTravelRef.current?.();
    };
  }, []);

  function getStationTop(index: number) {
    const station = STATIONS[index];
    const targetId = window.innerWidth <= 699 && station.mobileTarget
      ? station.mobileTarget
      : station.target;
    const target = document.getElementById(targetId);
    if (!target) return window.scrollY;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    if (index === 0) return 0;
    if (index === STATIONS.length - 1) {
      return targetTop + Math.max(0, target.offsetHeight - window.innerHeight * 1.05);
    }
    return targetTop + Math.max(0, (target.offsetHeight - window.innerHeight) / 2);
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

  function writeJourneyHistory(index: number, mode: 'push' | 'replace') {
    const destination = STATIONS[index].destination;
    const hash = JOURNEY_DESTINATION_HASH[destination];
    if (window.location.hash === hash) return;
    const state = { ...(window.history.state ?? {}), journeyDestination: destination };
    if (mode === 'push') window.history.pushState(state, '', hash);
    else window.history.replaceState(state, '', hash);
  }

  function startAdaptiveTravel(
    index: number,
    mode: 'fast' | 'warp',
    historyMode: 'push' | 'replace' | 'none' = 'none',
  ) {
    cancelTravelRef.current?.();
    window.scrollTo({ top: window.scrollY, behavior: 'auto' });
    if (historyMode !== 'none') writeJourneyHistory(index, historyMode);

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
    const mobileMenuWasOpen = mobileMenuOpen;
    setMobileMenuOpen(false);
    setActiveIndex(index);
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

    if (window.innerWidth <= 699) {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) activeElement.blur();

      window.cancelAnimationFrame(mobileNavigationFrameRef.current);
      if (!mobileMenuWasOpen) {
        startAdaptiveTravel(index, 'warp', 'push');
        return;
      }

      // Die geöffnete mobile Stationsliste sperrt den Body via :has(...).
      // React muss zuerst die is-open-Klasse entfernen und Mobile Safari die
      // Scroll-Sperre neu berechnen, bevor das Ziel zuverlässig gesetzt wird.
      mobileNavigationFrameRef.current = window.requestAnimationFrame(() => {
        mobileNavigationFrameRef.current = window.requestAnimationFrame(() => {
          startAdaptiveTravel(index, 'warp', 'push');
        });
      });
      return;
    }

    const stationDistance = Math.abs(index - activeIndex);
    startAdaptiveTravel(index, stationDistance >= 2 ? 'warp' : 'fast', 'push');
  }

  useEffect(() => {
    const warpToDestination = (event: Event) => {
      const destination = (event as CustomEvent<JourneyDestination>).detail;
      const targetIndex = STATION_INDEX.get(destination);
      if (targetIndex === undefined) return;
      setActiveIndex(targetIndex);
      startAdaptiveTravel(targetIndex, 'warp', 'push');
    };
    window.addEventListener(JOURNEY_DESTINATION_WARP_EVENT, warpToDestination);
    return () => window.removeEventListener(JOURNEY_DESTINATION_WARP_EVENT, warpToDestination);
  }, []);

  // Direkte Hash-Links sowie Browser-Zurück/Vorwärts werden erst hier auf
  // das echte responsive Ziel aufgelöst. Dadurch scrollt beispielsweise
  // #journey-references auf Mobile zur mobilen Referenzstation und nicht zum
  // unsichtbaren Desktop-Anker mit demselben Kapitel-Namen.
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const navigateFromHistory = () => {
      window.cancelAnimationFrame(historyNavigationFrameRef.current);
      historyNavigationFrameRef.current = window.requestAnimationFrame(() => {
        const destination = getJourneyDestinationFromHash(window.location.hash);
        initialHistoryResolvedRef.current = true;
        if (!destination) {
          writeJourneyHistory(0, 'replace');
          return;
        }
        const targetIndex = STATION_INDEX.get(destination);
        if (targetIndex === undefined) return;
        const canonicalHash = JOURNEY_DESTINATION_HASH[destination];
        if (window.location.hash !== canonicalHash) {
          window.history.replaceState(
            { ...(window.history.state ?? {}), journeyDestination: destination },
            '',
            canonicalHash,
          );
        }
        setMobileMenuOpen(false);
        setActiveIndex(targetIndex);
        startAdaptiveTravel(targetIndex, 'warp', 'none');
      });
    };

    const initialTimer = window.setTimeout(navigateFromHistory, 80);
    window.addEventListener('popstate', navigateFromHistory);
    window.addEventListener('hashchange', navigateFromHistory);
    return () => {
      window.clearTimeout(initialTimer);
      window.cancelAnimationFrame(historyNavigationFrameRef.current);
      window.removeEventListener('popstate', navigateFromHistory);
      window.removeEventListener('hashchange', navigateFromHistory);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

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
          onClick={() => openJourneyLeadForm('project', {
            travel: 'warp',
            ctaId: 'journey_navigation_project',
          })}
        >
          {lang === 'de' ? 'Projekt besprechen' : 'Discuss your project'}
        </button>
        <div className="journey-utility-legal">
          <a href="/datenschutz">{lang === 'de' ? 'Datenschutz' : 'Privacy'}</a>
          <span aria-hidden="true">·</span>
          <a href="/impressum">{lang === 'de' ? 'Impressum' : 'Legal notice'}</a>
        </div>
      </div>
      <button
        type="button"
        className={`journey-mobile-backdrop ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-label={lang === 'de' ? 'Stationsübersicht schliessen' : 'Close station overview'}
        tabIndex={mobileMenuOpen ? 0 : -1}
        onClick={() => setMobileMenuOpen(false)}
      />
      <section
        className={`journey-mobile-sheet ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!mobileMenuOpen}
        aria-label={lang === 'de' ? 'Alle Stationen' : 'All stations'}
      >
        <header>
          <div>
            <span>{lang === 'de' ? 'DEINE REISE' : 'YOUR JOURNEY'}</span>
            <strong>{STATIONS[activeIndex].label[lang]}</strong>
          </div>
          <button
            type="button"
            tabIndex={mobileMenuOpen ? 0 : -1}
            aria-label={lang === 'de' ? 'Schliessen' : 'Close'}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={22} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>
        <div className="journey-mobile-stations">
          {STATIONS.map((station, index) => (
            <button
              key={`mobile-${station.target}`}
              type="button"
              className={index === activeIndex ? 'is-active' : ''}
              tabIndex={mobileMenuOpen ? 0 : -1}
              aria-current={index === activeIndex ? 'location' : undefined}
              onClick={() => goToStation(index)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{station.label[lang]}</strong>
              <ChevronRight size={19} strokeWidth={2} aria-hidden="true" />
            </button>
          ))}
        </div>
        <footer>
          <div className="journey-mobile-language" aria-label={lang === 'de' ? 'Sprache wählen' : 'Choose language'}>
            <button type="button" tabIndex={mobileMenuOpen ? 0 : -1} className={lang === 'de' ? 'is-active' : ''} onClick={() => setLang('de')}>DE</button>
            <span>/</span>
            <button type="button" tabIndex={mobileMenuOpen ? 0 : -1} className={lang === 'en' ? 'is-active' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
          <button
            type="button"
            className="journey-mobile-project"
            tabIndex={mobileMenuOpen ? 0 : -1}
            onClick={() => {
              setMobileMenuOpen(false);
              openJourneyLeadForm('project', { travel: 'warp', ctaId: 'mobile_navigation_project' });
            }}
          >
            {lang === 'de' ? 'Projekt besprechen' : 'Discuss your project'}
          </button>
        </footer>
      </section>
      <div className="journey-mobile-bar">
        <button
          type="button"
          className="journey-mobile-step"
          disabled={activeIndex === 0}
          aria-label={lang === 'de' ? 'Vorherige Station' : 'Previous station'}
          onClick={() => goToStation(Math.max(0, activeIndex - 1))}
        >
          <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="journey-mobile-current"
          aria-expanded={mobileMenuOpen}
          aria-label={lang === 'de' ? 'Stationsübersicht öffnen' : 'Open station overview'}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <List size={18} strokeWidth={2} aria-hidden="true" />
          <span>
            <strong>{STATIONS[activeIndex].label[lang]}</strong>
            <small>{String(activeIndex + 1).padStart(2, '0')} / {String(STATIONS.length).padStart(2, '0')}</small>
          </span>
        </button>
        <button
          type="button"
          className="journey-mobile-step"
          disabled={activeIndex === STATIONS.length - 1}
          aria-label={lang === 'de' ? 'Nächste Station' : 'Next station'}
          onClick={() => goToStation(Math.min(STATIONS.length - 1, activeIndex + 1))}
        >
          <ChevronRight size={22} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
      </nav>
    </>
  );
}
