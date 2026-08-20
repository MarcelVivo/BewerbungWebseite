'use client';

import { ArrowRight, Check, X } from 'lucide-react';
import { buildAilaLeadObject } from '@/app/lib/aila/engine';
import { trackWebsiteEvent } from '@/app/lib/analytics';
import { openJourneyLeadForm } from '@/app/lib/journeyNavigation';
import type { AilaRecommendation, AilaSalesContext } from '@/app/lib/aila/types';
import type { ExperienceLang } from './content';
import styles from './experience.module.css';

export default function AilaSolutionPreview({
  lang,
  recommendation,
  context,
  onClose,
}: {
  lang: ExperienceLang;
  recommendation: AilaRecommendation;
  context: AilaSalesContext;
  onClose: () => void;
}) {
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
    <aside className={styles.ailaSolutionPreview} aria-label={copy.kicker}>
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
        <button type="button" onClick={onClose}>{copy.continue}</button>
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
            openJourneyLeadForm('consultation', { ctaId: 'aila-solution-handover' });
          }}
        >
          {copy.discuss}<ArrowRight size={15} />
        </button>
      </footer>
    </aside>
  );
}
