'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from 'lucide-react';
import { trackWebsiteEvent } from '@/app/lib/analytics';
import type { AilaLeadObject, AilaRecommendation } from '@/app/lib/aila/types';
import type { ExperienceLang } from './content';
import styles from './experience.module.css';

type Contact = { name: string; email: string; phone: string; company: string };
type ConversationMessage = { role: 'user' | 'assistant'; content: string };

export default function AilaContactCapture({
  lang,
  lead,
  recommendation,
  conversation,
  onBack,
  onSuccess,
}: {
  lang: ExperienceLang;
  lead: AilaLeadObject;
  recommendation?: AilaRecommendation;
  conversation: ConversationMessage[];
  onBack: () => void;
  onSuccess: (contact: Contact) => void;
}) {
  const hasConversationContext = conversation.some((message) => message.role === 'user' && message.content.trim())
    || Boolean(lead.conversationSummary.trim());
  const copy = lang === 'de'
    ? {
        kicker: 'PERSÖNLICHE ÜBERGABE', title: 'Dein Anliegen direkt an Marcel übergeben.',
        intro: 'AILA sendet deine Kontaktdaten zusammen mit den Erkenntnissen aus diesem Gespräch. Du musst nichts nochmals erklären.',
        directIntro: 'Beschreibe kurz, worum es geht. So kann Marcel deine Anfrage sinnvoll einordnen und vorbereitet antworten.',
        request: 'Worum geht es?', requestPlaceholder: 'Was möchtest du verbessern, lösen oder erreichen?',
        name: 'Name', email: 'E-Mail', phone: 'Telefonnummer', company: 'Unternehmen (optional)',
        consentA: 'Ich habe die ', consentLink: 'Datenschutzerklärung', consentB: ' gelesen und stimme der Kontaktaufnahme sowie der Übermittlung dieses AILA-Gesprächs zu.',
        directConsentB: ' gelesen und stimme der Kontaktaufnahme sowie der Übermittlung meiner Angaben zu.',
        send: 'An Marcel senden', sending: 'Wird übermittelt', back: 'Zurück zum Gespräch',
        error: 'Bitte fülle Name, E-Mail und Telefonnummer korrekt aus und bestätige den Datenschutz.',
        contextError: 'Bitte beschreibe kurz dein Anliegen, damit Marcel deine Anfrage sinnvoll einordnen kann.',
        serverError: 'Die Übergabe hat nicht funktioniert. Bitte versuche es nochmals oder schreibe an kontakt@marcelspahr.ch.',
      }
    : {
        kicker: 'PERSONAL HANDOVER', title: 'Send your request directly to Marcel.',
        intro: 'AILA sends your contact details together with the insights from this conversation. You will not need to explain everything again.',
        directIntro: 'Briefly describe what you need so Marcel can assess your enquiry and respond prepared.',
        request: 'What is this about?', requestPlaceholder: 'What would you like to improve, solve or achieve?',
        name: 'Name', email: 'Email', phone: 'Phone number', company: 'Company (optional)',
        consentA: 'I have read the ', consentLink: 'privacy policy', consentB: ' and agree to being contacted and to this AILA conversation being transmitted.',
        directConsentB: ' and agree to being contacted and to my information being transmitted.',
        send: 'Send to Marcel', sending: 'Sending', back: 'Back to conversation',
        error: 'Please enter a valid name, email address and phone number and accept the privacy policy.',
        contextError: 'Please briefly describe your request so Marcel can assess it properly.',
        serverError: 'The handover did not work. Please try again or email kontakt@marcelspahr.ch.',
      };

  // The visitor has already spent time in the AILA conversation before this
  // short handover form appears. Account for that so browser autofill is not
  // mistaken for a bot submission by the shared minimum-fill-time guard.
  const startedAt = useRef(Date.now() - 3000);
  const [contact, setContact] = useState<Contact>({
    name: lead.contact.name || '',
    email: lead.contact.email || '',
    phone: lead.contact.phone || '',
    company: lead.contact.company || lead.company || '',
  });
  const [consent, setConsent] = useState(false);
  const [requestContext, setRequestContext] = useState('');
  const [hpWebsite, setHpWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof Contact, value: string) => {
    setContact((current) => ({ ...current, [key]: value }));
    setError('');
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = {
      name: contact.name.trim(),
      email: contact.email.trim(),
      phone: contact.phone.trim(),
      company: contact.company.trim(),
    };
    const directRequest = requestContext.trim();
    if (!hasConversationContext && directRequest.length < 10) {
      setError(copy.contextError);
      return;
    }
    if (!normalized.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email) || !/^[+()\d\s.\-/]{6,40}$/.test(normalized.phone) || !consent) {
      setError(copy.error);
      return;
    }

    setSubmitting(true);
    setError('');
    trackWebsiteEvent('form_submit', { formId: 'consultation', metadata: { stage: 'aila_handover' } });
    try {
      const response = await fetch('/api/aila/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: normalized,
          lead: { ...lead, contact: normalized, company: normalized.company || lead.company },
          recommendation,
          conversation,
          conversationSummary: lead.conversationSummary,
          directRequest: hasConversationContext ? '' : directRequest,
          lang,
          consent,
          hpWebsite,
          startedAt: startedAt.current,
        }),
      });
      if (!response.ok) throw new Error('handover failed');
      trackWebsiteEvent('form_success', { formId: 'consultation', metadata: { stage: 'aila_handover' } });
      trackWebsiteEvent('aila_handover', { metadata: { stage: 'handover', lead_temperature: lead.leadTemperature } });
      onSuccess(normalized);
    } catch {
      setError(copy.serverError);
      trackWebsiteEvent('form_error', { formId: 'consultation', metadata: { stage: 'aila_handover' } });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.ailaContactCapture} onSubmit={submit} noValidate>
      <span className={styles.ailaContactKicker}>{copy.kicker}</span>
      <h3>{copy.title}</h3>
      <p>{hasConversationContext ? copy.intro : copy.directIntro}</p>
      {!hasConversationContext && (
        <label className={styles.ailaContactContext}>
          <span>{copy.request}</span>
          <textarea
            value={requestContext}
            onChange={(event) => { setRequestContext(event.target.value); setError(''); }}
            placeholder={copy.requestPlaceholder}
            rows={3}
            minLength={10}
            maxLength={1600}
            required
          />
        </label>
      )}
      <div className={styles.ailaContactFields}>
        <label><span>{copy.name}</span><input value={contact.name} onChange={(event) => set('name', event.target.value)} autoComplete="name" required /></label>
        <label><span>{copy.email}</span><input type="email" value={contact.email} onChange={(event) => set('email', event.target.value)} autoComplete="email" inputMode="email" required /></label>
        <label><span>{copy.phone}</span><input type="tel" value={contact.phone} onChange={(event) => set('phone', event.target.value)} autoComplete="tel" inputMode="tel" required /></label>
        <label><span>{copy.company}</span><input value={contact.company} onChange={(event) => set('company', event.target.value)} autoComplete="organization" /></label>
      </div>
      <label className={styles.ailaContactConsent}>
        <input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setError(''); }} required />
        <span>{copy.consentA}<a href="/datenschutz" target="_blank" rel="noreferrer">{copy.consentLink}</a>{hasConversationContext ? copy.consentB : copy.directConsentB}</span>
      </label>
      <label className={styles.honeypot} aria-hidden="true">Website<input value={hpWebsite} onChange={(event) => setHpWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></label>
      {error && <p className={styles.ailaContactError} role="alert">{error}</p>}
      <div className={styles.ailaContactActions}>
        <button type="button" onClick={onBack} disabled={submitting}><ArrowLeft size={14} />{copy.back}</button>
        <button type="submit" disabled={submitting}>{submitting ? <LoaderCircle className={styles.spinner} size={15} /> : <Check size={15} />}<span>{submitting ? copy.sending : copy.send}</span><ArrowRight size={15} /></button>
      </div>
    </form>
  );
}
