'use client';

import { Download, RefreshCw, Share2, WifiOff, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/app/LanguageContext';
import styles from './PwaRuntime.module.css';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const COPY = {
  de: {
    install: 'Als App installieren', appTitle: 'Marcel Spahr als App',
    appText: 'Schneller zurückkehren und AILA jederzeit direkt erreichen.',
    iosText: 'In Safari auf Teilen und danach „Zum Home-Bildschirm“ tippen.',
    later: 'Später', update: 'Neue Version verfügbar', refresh: 'Aktualisieren',
    offline: 'Offline – AILA wartet auf die Verbindung', online: 'Wieder online',
    close: 'Hinweis schliessen',
  },
  en: {
    install: 'Install app', appTitle: 'Marcel Spahr as an app',
    appText: 'Return faster and reach AILA directly at any time.',
    iosText: 'In Safari, tap Share and then “Add to Home Screen”.',
    later: 'Later', update: 'A new version is available', refresh: 'Update',
    offline: 'Offline – AILA is waiting for the connection', online: 'Back online',
    close: 'Close notice',
  },
} as const;

export default function PwaRuntime() {
  const { lang } = useLanguage();
  const pathname = usePathname();
  const c = COPY[lang];
  const isPrivateArea = pathname.startsWith('/dashboard')
    || pathname.startsWith('/recruiter')
    || pathname.startsWith('/auth')
    || pathname === '/login';
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [updateWorker, setUpdateWorker] = useState<ServiceWorker | null>(null);
  const [online, setOnline] = useState(true);
  const [connectionNotice, setConnectionNotice] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    document.documentElement.dataset.displayMode = standalone ? 'standalone' : 'browser';
    setOnline(navigator.onLine);

    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      window.setTimeout(() => setShowInstall(true), 12000);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setShowInstall(false);
      setShowIosHelp(false);
      document.documentElement.dataset.displayMode = 'standalone';
    };
    const handleOnline = () => {
      setOnline(true);
      setConnectionNotice(true);
      window.setTimeout(() => setConnectionNotice(false), 2800);
    };
    const handleOffline = () => { setOnline(false); setConnectionNotice(true); };

    window.addEventListener('beforeinstallprompt', handleInstall);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const isAppleMobile = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!standalone && isAppleMobile) {
      const seen = sessionStorage.getItem('ms-pwa-install-seen');
      if (!seen) window.setTimeout(() => setShowInstall(true), 18000);
    }

    if ('serviceWorker' in navigator && (window.isSecureContext || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
        if (registration.waiting) setUpdateWorker(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateWorker(worker);
          });
        });
      }).catch(() => undefined);

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    const params = new URLSearchParams(window.location.search);
    let ailaTimer = 0;
    if (params.get('aila') === '1' && window.location.pathname === '/') {
      let attempts = 0;
      const openWhenReady = () => {
        const root = document.querySelector<HTMLElement>('.experience-root');
        if (root?.dataset.heroPhase === 'revealed' || attempts >= 12) {
          window.dispatchEvent(new Event('aila:open-sales-conversation'));
          return;
        }
        attempts += 1;
        ailaTimer = window.setTimeout(openWhenReady, 500);
      };
      ailaTimer = window.setTimeout(openWhenReady, 800);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearTimeout(ailaTimer);
    };
  }, []);

  const requestInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setShowInstall(false);
      setInstallPrompt(null);
      return;
    }
    setShowIosHelp(true);
  };

  const dismissInstall = () => {
    setShowInstall(false);
    setShowIosHelp(false);
    try { sessionStorage.setItem('ms-pwa-install-seen', '1'); } catch {}
  };

  return (
    <>
      {connectionNotice && (
        <div className={`${styles.connection} ${online ? styles.connectionOnline : ''}`} role="status">
          {online ? <RefreshCw size={17} /> : <WifiOff size={17} />}
          <span>{online ? c.online : c.offline}</span>
        </div>
      )}

      {updateWorker && (
        <div className={styles.update} role="status">
          <span>{c.update}</span>
          <button type="button" onClick={() => updateWorker.postMessage({ type: 'SKIP_WAITING' })}>
            <RefreshCw size={16} /> {c.refresh}
          </button>
        </div>
      )}

      {showInstall && !isPrivateArea && (
        <aside className={styles.installCard} aria-label={c.install}>
          <button className={styles.dismiss} type="button" onClick={dismissInstall} aria-label={c.close}><X size={17} /></button>
          <div className={styles.installIcon}><Download size={22} /></div>
          <div>
            <strong>{c.appTitle}</strong>
            <p>{showIosHelp ? c.iosText : c.appText}</p>
          </div>
          <button className={styles.installAction} type="button" onClick={requestInstall}>
            {showIosHelp ? <Share2 size={17} /> : <Download size={17} />}
            {c.install}
          </button>
        </aside>
      )}
    </>
  );
}
