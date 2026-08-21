'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, LoaderCircle, RotateCcw } from 'lucide-react';
import { trackWebsiteEvent } from '../../app/lib/analytics';
import styles from './experience.module.css';

const OPTIONS = {
  de: {
    focus: ['Komplettes digitales System', 'Website & Marketing', 'CRM & ERP', 'Automatisierung & AI', 'Daten & Integrationen', 'Noch nicht sicher'],
    sizes: ['1 Person', '2–10', '11–50', '51–250', '250+'],
    labels: ['01 · Ziel', '02 · Unternehmen', '03 · Kontakt'],
    firstQuestion: 'Was willst du verbessern?', firstHint: 'Wähle den Bereich, der deinem aktuellen Anliegen am nächsten kommt.',
    secondQuestion: 'Wie gross ist dein Unternehmen?', secondHint: 'Das hilft mir, Prozesse, Rollen und Einführung realistisch einzuordnen.',
    finalQuestion: 'Was bremst euch heute?', finalHint: 'Ein paar Stichworte reichen. Ich lese jede Anfrage persönlich.',
    problem: 'Aktuelles Hauptproblem', problemPlaceholder: 'Zum Beispiel: Anfragen werden manuell übertragen, Daten liegen in mehreren Tools …',
    name: 'Dein Name', company: 'Unternehmen (optional)', email: 'E-Mail',
    consentA: 'Ich habe die ', consentLink: 'Datenschutzerklärung', consentB: ' gelesen und stimme der Verarbeitung meiner Angaben zur Bearbeitung der Anfrage zu.',
    next: 'Weiter', back: 'Zurück', send: 'Projekt besprechen', sending: 'Wird gesendet',
    error: 'Bitte fülle die markierten Felder aus und bestätige den Datenschutz.', serverError: 'Das Senden hat nicht funktioniert. Schreib mir alternativ an kontakt@marcelspahr.ch.',
    thanks: 'Danke. Deine Anfrage ist angekommen.', thanksText: 'Ich prüfe deine Angaben persönlich und melde mich innerhalb von zwei Arbeitstagen bei dir.', again: 'Neue Anfrage',
  },
  en: {
    focus: ['Complete digital system', 'Website & marketing', 'CRM & ERP', 'Automation & AI', 'Data & integrations', 'Not sure yet'],
    sizes: ['1 person', '2–10', '11–50', '51–250', '250+'],
    labels: ['01 · Goal', '02 · Company', '03 · Contact'],
    firstQuestion: 'What do you want to improve?', firstHint: 'Choose the area that comes closest to your current need.',
    secondQuestion: 'How large is your company?', secondHint: 'This helps me assess processes, roles and introduction realistically.',
    finalQuestion: 'What is slowing you down today?', finalHint: 'A few notes are enough. I read every enquiry personally.',
    problem: 'Current main problem', problemPlaceholder: 'For example: enquiries are transferred manually, data is spread across several tools …',
    name: 'Your name', company: 'Company (optional)', email: 'Email',
    consentA: 'I have read the ', consentLink: 'privacy policy', consentB: ' and agree to the processing of my information for handling this enquiry.',
    next: 'Continue', back: 'Back', send: 'Discuss the project', sending: 'Sending',
    error: 'Please complete the marked fields and confirm the privacy policy.', serverError: 'The message could not be sent. Alternatively, email kontakt@marcelspahr.ch.',
    thanks: 'Thank you. Your enquiry has arrived.', thanksText: 'I will personally review your information and contact you within two business days.', again: 'New enquiry',
  },
} as const;

export default function LeadFunnel({ lang }: { lang: 'de' | 'en' }) {
  const c = OPTIONS[lang];
  const openedAt = useRef(Date.now());
  const started = useRef(false);
  const previousStep = useRef(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState('');
  const [size, setSize] = useState('');
  const [problem, setProblem] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [hpWebsite, setHpWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    if (!window.matchMedia('(max-width: 1100px)').matches) return;
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.requestAnimationFrame(() => stageRef.current?.scrollIntoView({ behavior, block: 'start' }));
  }, [step]);

  function advance() {
    if ((step === 0 && !focus) || (step === 1 && !size)) {
      setError(c.error);
      return;
    }
    const next = Math.min(2, step + 1);
    setStep(next);
    setError('');
    trackWebsiteEvent('form_step', { formId: 'project', step: next + 1 });
  }

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackWebsiteEvent('form_start', { formId: 'project', step: step + 1 });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!problem.trim() || !name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !consent) {
      setError(c.error);
      return;
    }
    setSubmitting(true);
    trackWebsiteEvent('form_submit', { formId: 'project', step: 3 });
    const message = [
      `${lang === 'de' ? 'Ziel' : 'Goal'}: ${focus}`,
      `${lang === 'de' ? 'Unternehmensgrösse' : 'Company size'}: ${size}`,
      company.trim() ? `${lang === 'de' ? 'Unternehmen' : 'Company'}: ${company.trim()}` : null,
      '',
      problem.trim(),
    ].filter((line): line is string => line !== null).join('\n');
    try {
      const response = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message, consent, hpWebsite, startedAt: openedAt.current }),
      });
      if (!response.ok) throw new Error('submit failed');
      setSubmitted(true);
      trackWebsiteEvent('form_success', { formId: 'project', step: 3 });
    } catch {
      setError(c.serverError);
      trackWebsiteEvent('form_error', { formId: 'project', step: 3 });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className={styles.funnelSuccess} role="status">
        <span><Check size={25} /></span>
        <h3>{c.thanks}</h3>
        <p>{c.thanksText}</p>
        <button type="button" className={styles.primaryButton} onClick={() => { setSubmitted(false); setStep(0); setFocus(''); setSize(''); setProblem(''); setName(''); setCompany(''); setEmail(''); setConsent(false); }}><span>{c.again}</span><RotateCcw size={16} /></button>
      </div>
    );
  }

  return (
    <form className={styles.funnel} onSubmit={submit} noValidate onFocusCapture={markStarted}>
      <div className={styles.funnelProgress} aria-label={`${lang === 'de' ? 'Schritt' : 'Step'} ${step + 1} / 3`}>
        {c.labels.map((label, index) => (
          <button key={label} type="button" disabled={index > step} onClick={() => setStep(index)} className={index <= step ? styles.funnelProgressActive : ''}>
            <i>{index < step ? <Check size={11} /> : index + 1}</i><span>{label}</span>
          </button>
        ))}
      </div>

      <div ref={stageRef} className={styles.funnelStage}>
        {step === 0 && (
          <fieldset>
            <legend>{c.firstQuestion}</legend>
            <p>{c.firstHint}</p>
            <div className={styles.choiceGrid}>
              {c.focus.map((option) => <button key={option} type="button" aria-pressed={focus === option} onClick={() => { setFocus(option); setError(''); }}>{option}<span>{focus === option ? <Check size={15} /> : <ArrowRight size={15} />}</span></button>)}
            </div>
          </fieldset>
        )}
        {step === 1 && (
          <fieldset>
            <legend>{c.secondQuestion}</legend>
            <p>{c.secondHint}</p>
            <div className={styles.sizeGrid}>
              {c.sizes.map((option) => <button key={option} type="button" aria-pressed={size === option} onClick={() => { setSize(option); setError(''); }}><span>{option}</span></button>)}
            </div>
          </fieldset>
        )}
        {step === 2 && (
          <fieldset>
            <legend>{c.finalQuestion}</legend>
            <p>{c.finalHint}</p>
            <label className={styles.fullField}><span>{c.problem}</span><textarea value={problem} onChange={(event) => { setProblem(event.target.value); setError(''); }} placeholder={c.problemPlaceholder} rows={4} required /></label>
            <div className={styles.fieldGrid}>
              <label><span>{c.name}</span><input value={name} onChange={(event) => { setName(event.target.value); setError(''); }} autoComplete="name" required /></label>
              <label><span>{c.company}</span><input value={company} onChange={(event) => setCompany(event.target.value)} autoComplete="organization" /></label>
              <label className={styles.fullField}><span>{c.email}</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} autoComplete="email" required /></label>
            </div>
            <label className={styles.consent}>
              <input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setError(''); }} required />
              <span>{c.consentA}<a href="/datenschutz" target="_blank" rel="noreferrer">{c.consentLink}</a>{c.consentB}</span>
            </label>
          </fieldset>
        )}
      </div>

      <label className={styles.honeypot} aria-hidden="true">Website<input value={hpWebsite} onChange={(event) => setHpWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></label>
      {error && <p className={styles.funnelError} role="alert">{error}</p>}
      <div className={styles.funnelActions}>
        {step > 0 ? <button type="button" className={styles.backButton} onClick={() => { setStep(step - 1); setError(''); }}><span>{c.back}</span><ArrowLeft size={16} /></button> : <span />}
        {step < 2
          ? <button type="button" className={styles.primaryButton} onClick={advance}><span>{c.next}</span><ArrowRight size={16} /></button>
          : <button type="submit" className={styles.primaryButton} disabled={submitting}><span>{submitting ? <LoaderCircle className={styles.spinner} size={15} /> : null}{submitting ? c.sending : c.send}</span><ArrowRight size={16} /></button>}
      </div>
    </form>
  );
}
