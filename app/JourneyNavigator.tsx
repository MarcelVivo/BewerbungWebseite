'use client';

import { useEffect, useState } from 'react';
import { Chakra_Petch } from 'next/font/google';
import { useLanguage } from './LanguageContext';

const chakraPetch = Chakra_Petch({ subsets: ['latin'], weight: '700', display: 'swap' });

const STATIONS = [
  { label: { de: 'Start', en: 'Start' }, target: 'journey-start' },
  { label: { de: 'Lösungen', en: 'Solutions' }, target: 'journey-solutions', mobileTarget: 'mobile-solutions' },
  { label: { de: 'Dein Mehrwert', en: 'Your Value' }, target: 'journey-value', mobileTarget: 'mobile-journey-value' },
  { label: { de: 'Meine Referenzen', en: 'My References' }, target: 'journey-references', mobileTarget: 'mobile-journey-references' },
  { label: { de: 'Über mich', en: 'About Me' }, target: 'journey-about', mobileTarget: 'mobile-journey-about' },
  { label: { de: 'Deine Beratung', en: 'Your Consultation' }, target: 'journey-contact', mobileTarget: 'mobile-journey-contact' },
];

// Dieselben normierten Positionen, an denen die Desktop-Kamera ihre sechs
// inhaltlichen Stationen zeigt. So stimmen Klickziel, sichtbarer Inhalt und
// aktive Beschriftung der rechten Navigation immer miteinander überein.
const DESKTOP_STATION_PROGRESS = [0, 26 / 55.5, 0.56, 0.7, 0.93, 1];
const DESKTOP_ACTIVE_THRESHOLDS = [26 / 55.5, 0.56, 0.7, 0.91, 0.9748];

export default function JourneyNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    let rafId = 0;

    const update = () => {
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

  function goToStation(index: number) {
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
        const label = station.label[lang];
        return (
          <button
            key={station.target}
            type="button"
            className={`journey-station ${isActive ? 'is-active' : ''} ${isVisited ? 'is-visited' : ''}`}
            aria-current={isActive ? 'location' : undefined}
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
          {lang === 'de' ? 'Kontakt' : 'Contact'}
        </button>
        <div className="journey-utility-legal">
          <a href="/datenschutz">{lang === 'de' ? 'Datenschutz' : 'Privacy'}</a>
          <span aria-hidden="true">·</span>
          <a href="/impressum">{lang === 'de' ? 'Impressum' : 'Legal notice'}</a>
        </div>
      </div>
    </nav>
  );
}
