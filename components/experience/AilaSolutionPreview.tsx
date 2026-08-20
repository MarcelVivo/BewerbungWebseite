'use client';

import { ArrowRight, Check, X } from 'lucide-react';
import { useEffect } from 'react';
import { buildAilaLeadObject } from '@/app/lib/aila/engine';
import { trackWebsiteEvent } from '@/app/lib/analytics';
import type { AilaRecommendation, AilaSalesContext } from '@/app/lib/aila/types';
import type { ExperienceLang } from './content';
import styles from './experience.module.css';

export default function AilaSolutionPreview({
  lang,
  recommendation,
  context,
  onClose,
  onContinue,
  onContact,
}: {
  lang: ExperienceLang;
  recommendation: AilaRecommendation;
  context: AilaSalesContext;
  onClose: () => void;
  onContinue: () => void;
  onContact: () => void;
}) {
  useEffect(() => {
    const compactDialog = window.matchMedia('(max-width: 700px), (max-width: 960px) and (hover: none) and (pointer: coarse)').matches;
    if (!compactDialog) return;

    const root = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      rootOverflow: root.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
    };
    const syncViewport = () => {
      const viewport = window.visualViewport;
      root.style.setProperty('--aila-mobile-height', `${Math.round(viewport?.height ?? window.innerHeight)}px`);
      root.style.setProperty('--aila-mobile-top', `${Math.round(viewport?.offsetTop ?? 0)}px`);
    };
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };

    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    syncViewport();
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('scroll', syncViewport);
    window.addEventListener('orientationchange', syncViewport);
    window.addEventListener('keydown', handleKey);

    return () => {
      window.visualViewport?.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
      window.removeEventListener('keydown', handleKey);
      root.style.removeProperty('--aila-mobile-height');
      root.style.removeProperty('--aila-mobile-top');
      root.style.overflow = previous.rootOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.width = previous.bodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  const copy = lang === 'de'
    ? {
        kicker: 'AILA · LÖSUNGSSKIZZE',
        context: 'Aus deinem Gespräch',
        continue: 'Weiter mit AILA',
        discuss: 'Mit Marcel besprechen',
        close: 'Lösungsskizze schliessen',
        notNow: 'Bewusst nicht priorisiert',
      }
    : {
        kicker: 'AILA · SOLUTION OUTLINE',
        context: 'From your conversation',
        continue: 'Continue with AILA',
        discuss: 'Discuss with Marcel',
        close: 'Close solution outline',
        notNow: 'Deliberately not prioritised',
      };

  return (
    <aside className={styles.ailaSolutionPreview} role="dialog" aria-modal="true" aria-label={copy.kicker}>
      <header>
        <span>{copy.kicker}</span>
        <button type="button" onClick={onClose} aria-label={copy.close}><X size={16} /></button>
      </header>
      <div className={styles.ailaSolutionContext}>
        <small>{copy.context}</small>
        <p>
          {[context.industry, context.location, context.primaryGoal]
            .filter(Boolean)
            .join(' · ') || recommendation.summary}
        </p>
      </div>
      <h3>{recommendation.title}</h3>
      <p>{recommendation.summary}</p>
      <div className={styles.ailaSolutionServices}>
        {recommendation.services.map((service, index) => (
          <article key={service.serviceId} data-priority={service.priority}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h4>{service.name}</h4>
              <p>{service.reason}</p>
            </div>
            <Check size={15} aria-hidden="true" />
          </article>
        ))}
      </div>
      {recommendation.notRecommended.length > 0 && (
        <div className={styles.ailaSolutionExcluded}>
          <span>{copy.notNow}</span>
          <p>{recommendation.notRecommended.join(' · ')}</p>
        </div>
      )}
      <footer>
        <button type="button" onClick={onContinue}>{copy.continue}</button>
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('aila:guide-state', { detail: { state: 'success' } }));
            window.dispatchEvent(new CustomEvent('aila:handover', { detail: buildAilaLeadObject(context) }));
            trackWebsiteEvent('aila_contact_requested', {
              metadata: { stage: context.currentStage, lead_temperature: context.leadTemperature },
            });
            trackWebsiteEvent('aila_handover', {
              metadata: { stage: context.currentStage, lead_temperature: context.leadTemperature },
            });
            onContact();
          }}
        >
          {copy.discuss}<ArrowRight size={15} />
        </button>
      </footer>
    </aside>
  );
}
