'use client';

import { useEffect, useState } from 'react';
import { Chakra_Petch } from 'next/font/google';

const chakraPetch = Chakra_Petch({ subsets: ['latin'], weight: '700', display: 'swap' });

const STATIONS = [
  { label: 'Start', target: 'journey-start' },
  { label: 'Lösungen', target: 'services', mobileTarget: 'mobile-solutions' },
  { label: 'Dein Mehrwert', target: 'journey-value' },
  { label: 'Meine Referenzen', target: 'journey-references' },
  { label: 'Kontakt', target: 'journey-contact' },
  { label: 'Über mich', target: 'journey-about' },
];

export default function JourneyNavigator() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const update = () => {
      const probe = window.scrollY + window.innerHeight * 0.46;
      let current = 0;
      STATIONS.forEach((station, index) => {
        const targetId = window.innerWidth <= 699 && station.mobileTarget
          ? station.mobileTarget
          : station.target;
        const element = document.getElementById(targetId);
        if (element && element.getBoundingClientRect().top + window.scrollY <= probe) current = index;
      });
      setActiveIndex(current);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  function goToStation(index: number) {
    const station = STATIONS[index];
    const targetId = window.innerWidth <= 699 && station.mobileTarget
      ? station.mobileTarget
      : station.target;
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <nav className={`journey-navigator ${chakraPetch.className}`} aria-label="Seitennavigation">
      <span className="journey-rail" aria-hidden="true">
        <span
          className="journey-rail-progress"
          style={{ height: `${(activeIndex / (STATIONS.length - 1)) * 100}%` }}
        />
      </span>
      {STATIONS.map((station, index) => {
        const isActive = index === activeIndex;
        const isVisited = index < activeIndex;
        return (
          <button
            key={station.label}
            type="button"
            className={`journey-station ${isActive ? 'is-active' : ''} ${isVisited ? 'is-visited' : ''}`}
            aria-current={isActive ? 'location' : undefined}
            aria-label={`Zu ${station.label}`}
            onClick={() => goToStation(index)}
          >
            <span className="journey-label">{station.label}</span>
            <span className="journey-node" aria-hidden="true">
              <span className="journey-node-core" />
            </span>
          </button>
        );
      })}
      <span className="journey-count" aria-hidden="true">
        {String(activeIndex + 1).padStart(2, '0')} / {String(STATIONS.length).padStart(2, '0')}
      </span>
    </nav>
  );
}
