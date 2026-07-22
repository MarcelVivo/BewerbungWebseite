'use client';

import { useEffect, useRef } from 'react';
import { buildFlapWord, setFlapWordMode } from './lib/splitFlap';

const CARD_FLAP_REPEAT_MS = 10_000;

export default function PublicFlapHeading({
  label,
  as = 'h2',
  className = '',
}: {
  label: string;
  as?: 'h1' | 'h2';
  className?: string;
}) {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const Heading = as;

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const letters = buildFlapWord(title, label);
    setFlapWordMode(letters, 'settle', true);

    let settleTimer = 0;
    let repeatTimer = 0;
    let visibilityObserver: MutationObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let isVisible = false;

    const triggerFlap = () => {
      if (reduced || !isVisible) return;
      window.clearTimeout(settleTimer);
      setFlapWordMode(letters, 'spin', false);
      settleTimer = window.setTimeout(() => setFlapWordMode(letters, 'settle', false), 720);
    };

    const scheduleNextFlap = (): void => {
      window.clearTimeout(repeatTimer);
      if (reduced || !isVisible) return;
      repeatTimer = window.setTimeout(() => {
        triggerFlap();
        scheduleNextFlap();
      }, CARD_FLAP_REPEAT_MS);
    };

    const setVisibility = (nextVisible: boolean) => {
      if (nextVisible === isVisible) return;
      isVisible = nextVisible;
      if (isVisible) {
        triggerFlap();
        scheduleNextFlap();
        return;
      }
      window.clearTimeout(repeatTimer);
    };

    const visibilityHost = title.closest('[aria-hidden]');
    if (visibilityHost) {
      const updateVisibility = () => {
        const nextVisible = visibilityHost.getAttribute('aria-hidden') === 'false';
        setVisibility(nextVisible);
      };
      visibilityObserver = new MutationObserver(updateVisibility);
      visibilityObserver.observe(visibilityHost, { attributes: true, attributeFilter: ['aria-hidden'] });
      updateVisibility();
    } else {
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          const nextVisible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
          setVisibility(nextVisible);
        },
        { threshold: [0, 0.35, 0.75] },
      );
      intersectionObserver.observe(title);
    }

    return () => {
      visibilityObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.clearTimeout(settleTimer);
      window.clearTimeout(repeatTimer);
      setFlapWordMode(letters, 'settle', true);
    };
  }, [label]);

  return (
    <Heading
      ref={titleRef}
      className={`public-card-heading intro-flap-word ${className}`.trim()}
      aria-label={label}
    />
  );
}
