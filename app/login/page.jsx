"use client";

import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function getSafeDestination() {
    const requested = new URLSearchParams(window.location.search).get('next');
    if (requested === '/bewerbungsprofil' || requested === '/expertise') return requested;
    return '/bewerbungsprofil';
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error(await response.text());
      window.location.assign(getSafeDestination());
    } catch {
      setError('Benutzername oder Passwort ist nicht korrekt.');
      setSubmitting(false);
    }
  }

  return (
    <main className="recruiter-login-page">
      <div className="recruiter-login-aurora" aria-hidden="true" />
      <section className="recruiter-login-shell" aria-labelledby="recruiter-login-title">
        <header className="recruiter-login-heading">
          <p>VERTRAULICH · PERSÖNLICH · DIREKT</p>
          <h1 id="recruiter-login-title">RECRUITER-ZUGANG</h1>
        </header>

        <form onSubmit={onSubmit} className="recruiter-login-card">
          <div className="recruiter-login-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/MarcelSpahrHeader.jpg"
              alt="Marcel Spahr in einem modernen Arbeits- und Projektraum"
            />
            <div className="recruiter-login-portrait-shade" aria-hidden="true" />
            <div className="recruiter-login-quote">
              <blockquote>
                „Ich verbinde Empathie, Strategie und Technologie – zu digitalen Lösungen,
                die im Alltag wirken und mit Unternehmen wachsen.“
              </blockquote>
            </div>
            <div className="recruiter-login-signature" aria-label="Marcel Spahr">
              <div className="studio-web-signature is-writing" aria-hidden="true">
                <span className="studio-signature-ink studio-signature-ink--shadow" />
                <span className="studio-signature-ink" />
                <span className="studio-signature-pen" />
              </div>
            </div>
          </div>

          <div className="recruiter-login-form-panel">
            <div className="recruiter-login-intro">
              <div className="recruiter-login-lock" aria-hidden="true">
                <ShieldCheck size={22} strokeWidth={1.7} />
              </div>
              <div>
                <p>BEWERBUNGSPROFIL · MARCEL SPAHR</p>
                <h2>Willkommen im geschützten Bereich.</h2>
                <span>Lebenslauf, Diplome, Arbeitszeugnisse und Projektdokumente – persönlich für ausgewählte Empfänger bereitgestellt.</span>
              </div>
            </div>

            <div className="recruiter-login-fields">
              <label>
                <span>Benutzername</span>
                <input
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="Admin"
                  required
                />
              </label>
              <label>
                <span>Passwort</span>
                <span className="recruiter-login-password">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Passwort eingeben"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                  </button>
                </span>
              </label>
            </div>

            {error && <div className="recruiter-login-error" role="alert">{error}</div>}

            <div className="recruiter-login-actions">
              <button type="submit" disabled={submitting}>
                <LockKeyhole size={18} aria-hidden="true" />
                <span>{submitting ? 'Zugang wird geprüft …' : 'Bewerbungsprofil öffnen'}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <p>
                Keine Zugangsdaten?{' '}
                <a href="mailto:kontakt@marcelspahr.ch?subject=Zugang%20zum%20Bewerbungsprofil">
                  <Mail size={14} aria-hidden="true" /> Zugang anfragen
                </a>
              </p>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
