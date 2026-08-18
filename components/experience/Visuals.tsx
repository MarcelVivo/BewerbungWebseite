'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Activity, ArrowRight, Bot, Check, Database, FileText, Globe2, LockKeyhole, Mail, Search, ShieldCheck, Sparkles, Users, Workflow } from 'lucide-react';
import styles from './experience.module.css';

type SalesPerspectiveConfig = {
  x: number;
  y: number;
  width: number;
  height: number;
  horizontal: number;
  vertical: number;
  rotateY: number;
  perspective: number;
};

const SALES_PERSPECTIVE_STORAGE_KEY = 'ms-sales-perspective-v1';
const DEFAULT_SALES_PERSPECTIVE: SalesPerspectiveConfig = {
  x: 18.5,
  y: 42,
  width: 43,
  height: 23.5,
  horizontal: 6.39,
  vertical: 2.5,
  rotateY: -1.2,
  perspective: 2000,
};

const PERSPECTIVE_CONTROLS: ReadonlyArray<{
  key: keyof SalesPerspectiveConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}> = [
  { key: 'x', label: 'Position X', min: 0, max: 65, step: .1, suffix: '%' },
  { key: 'y', label: 'Position Y', min: 12, max: 78, step: .1, suffix: '%' },
  { key: 'width', label: 'Breite', min: 20, max: 78, step: .1, suffix: '%' },
  { key: 'height', label: 'Höhe', min: 10, max: 55, step: .1, suffix: '%' },
  { key: 'horizontal', label: 'Horizontale Flucht', min: -15, max: 15, step: .05, suffix: '°' },
  { key: 'vertical', label: 'Vertikale Flucht', min: -15, max: 15, step: .05, suffix: '°' },
  { key: 'rotateY', label: '3D-Drehung Y', min: -15, max: 15, step: .05, suffix: '°' },
  { key: 'perspective', label: 'Perspektivtiefe', min: 600, max: 4000, step: 10, suffix: ' px' },
];

function parseStoredPerspective(value: string | null): SalesPerspectiveConfig | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<SalesPerspectiveConfig>;
    const result = { ...DEFAULT_SALES_PERSPECTIVE };
    for (const control of PERSPECTIVE_CONTROLS) {
      const nextValue = parsed[control.key];
      if (typeof nextValue === 'number' && Number.isFinite(nextValue)) {
        result[control.key] = Math.min(control.max, Math.max(control.min, nextValue));
      }
    }
    return result;
  } catch {
    return null;
  }
}

export function BusinessFlow({ steps, active, onSelect }: { steps: readonly string[]; active: number; onSelect: (index: number) => void }) {
  return (
    <div className={styles.flowViewport}>
      <div className={styles.flowRail} aria-hidden="true"><span style={{ width: `${(active / (steps.length - 1)) * 100}%` }} /></div>
      <ol className={styles.flowList}>
        {steps.map((step, index) => (
          <li key={step} className={index <= active ? styles.flowReached : ''}>
            <button type="button" onClick={() => onSelect(index)} aria-current={active === index ? 'step' : undefined}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
              <i aria-hidden="true">{index < active ? <Check size={13} /> : index === active ? <Sparkles size={13} /> : null}</i>
            </button>
            {index < steps.length - 1 && <ArrowRight size={15} aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function PerspectiveBusinessFlow({
  steps,
  details,
  active,
  onSelect,
  label,
  hint,
  detailLabel,
  closeLabel,
}: {
  steps: readonly string[];
  details: readonly string[];
  active: number;
  onSelect: (index: number) => void;
  label: string;
  hint: string;
  detailLabel: string;
  closeLabel: string;
}) {
  const [selectedFlow, setSelectedFlow] = useState<number | null>(null);
  const [perspectiveConfig, setPerspectiveConfig] = useState<SalesPerspectiveConfig>(DEFAULT_SALES_PERSPECTIVE);
  const [perspectiveEditor, setPerspectiveEditor] = useState(false);
  const [editorStatus, setEditorStatus] = useState('Änderungen werden live angezeigt.');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPerspectiveEditor(params.get('perspective-editor') === '1');
    const stored = parseStoredPerspective(window.localStorage.getItem(SALES_PERSPECTIVE_STORAGE_KEY));
    if (stored) setPerspectiveConfig(stored);
  }, []);

  const horizontalShear = Math.tan(perspectiveConfig.horizontal * Math.PI / 180);
  const verticalShear = Math.tan(perspectiveConfig.vertical * Math.PI / 180);
  const determinant = 1 - horizontalShear * verticalShear;
  const inverseA = 1 / determinant;
  const inverseB = -horizontalShear / determinant;
  const inverseC = -verticalShear / determinant;
  const inverseD = 1 / determinant;
  const planeTransform = `perspective(${perspectiveConfig.perspective}px) matrix(1, ${horizontalShear}, ${verticalShear}, 1, 0, 0) rotateY(${perspectiveConfig.rotateY}deg)`;
  const perspectiveStyle = {
    '--flow-card-x': `${perspectiveConfig.x}%`,
    '--flow-card-y': `${perspectiveConfig.y}%`,
    '--flow-card-width': `${perspectiveConfig.width}%`,
    '--flow-card-height': `${perspectiveConfig.height}%`,
    '--flow-header-y': `${Math.max(0, perspectiveConfig.y - 4.5)}%`,
    '--flow-plane-transform': planeTransform,
    '--flow-perspective-depth': `${perspectiveConfig.perspective}px`,
    '--flow-inverse-a': inverseA,
    '--flow-inverse-b': inverseB,
    '--flow-inverse-c': inverseC,
    '--flow-inverse-d': inverseD,
    '--flow-counter-y': `${-perspectiveConfig.rotateY}deg`,
  } as CSSProperties;

  const updatePerspective = (key: keyof SalesPerspectiveConfig, value: number) => {
    setPerspectiveConfig((current) => ({ ...current, [key]: value }));
    setEditorStatus('Noch nicht lokal gespeichert.');
  };

  const savePerspective = () => {
    window.localStorage.setItem(SALES_PERSPECTIVE_STORAGE_KEY, JSON.stringify(perspectiveConfig));
    setEditorStatus('Lokal gespeichert – gilt auch ohne Editor-Panel.');
  };

  const copyPerspective = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(perspectiveConfig, null, 2));
      setEditorStatus('Konfiguration in die Zwischenablage kopiert.');
    } catch {
      setEditorStatus('Kopieren fehlgeschlagen. Bitte lokal speichern.');
    }
  };

  const resetPerspective = () => {
    setPerspectiveConfig(DEFAULT_SALES_PERSPECTIVE);
    window.localStorage.removeItem(SALES_PERSPECTIVE_STORAGE_KEY);
    setEditorStatus('Auf Ausgangswerte zurückgesetzt.');
  };

  const openPerspectiveEditor = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('perspective-editor', '1');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setPerspectiveEditor(true);
  };

  const closePerspectiveEditor = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('perspective-editor');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setPerspectiveEditor(false);
  };

  const selectFlow = (index: number) => {
    onSelect(index);
    setSelectedFlow((current) => current === index ? null : index);
  };

  return (
    <section className={styles.perspectiveFlow} style={perspectiveStyle} aria-label={label} onKeyDown={(event) => {
      if (event.key === 'Escape') setSelectedFlow(null);
    }}>
      <header className={styles.perspectiveFlowHeader}>
        <span><i />{label}</span>
        <small>{hint}</small>
      </header>

      <div className={styles.perspectiveFlowStage}>
        <div className={`${styles.perspectiveFlowCardGrid} ${selectedFlow !== null ? styles.perspectiveFlowCardGridOpen : ''}`}>
          {steps.map((step, index) => {
            const selected = selectedFlow === index;
            return (
              <button
                key={step}
                type="button"
                className={`${styles.perspectiveFlowNode} ${index <= active ? styles.perspectiveFlowReached : ''} ${selected ? styles.perspectiveFlowSelected : ''}`}
                style={{
                  '--flow-index': index,
                  '--flow-sequence-delay': `${index * .12}s`,
                } as CSSProperties}
                aria-current={active === index ? 'step' : undefined}
                aria-expanded={selected}
                aria-controls={`flow-detail-${index}`}
                aria-label={`${String(index + 1).padStart(2, '0')} · ${step}`}
                data-flow-index={index}
                onClick={() => selectFlow(index)}
              >
                <span className={styles.perspectiveFlowCardHead}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <strong>{step}</strong>
                  <i aria-hidden="true" />
                </span>
                <span
                  id={`flow-detail-${index}`}
                  className={styles.perspectiveFlowCardDetail}
                  aria-hidden={!selected}
                >
                  <small>{detailLabel}</small>
                  <span>{details[index]}</span>
                  <em>{closeLabel} ×</em>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!perspectiveEditor && (
        <button type="button" className={styles.perspectiveConfiguratorTrigger} onClick={openPerspectiveEditor}>
          <span aria-hidden="true">⌗</span>
          Perspektive einstellen
        </button>
      )}

      {perspectiveEditor && (
        <aside className={styles.perspectiveConfigurator} aria-label="Perspektiv-Konfigurator">
          <header>
            <div>
              <small>DESKTOP · LIVE</small>
              <strong>Perspektive ausrichten</strong>
            </div>
            <button type="button" onClick={closePerspectiveEditor} aria-label="Perspektiv-Konfigurator schließen">×</button>
          </header>
          <p>Richte die gesamte Kartenebene an den Kanten der Glasscheibe aus. Position und Größe gelten für große Bildschirme; die Fluchtwerte gelten auf allen Größen.</p>
          <div className={styles.perspectiveConfiguratorControls}>
            {PERSPECTIVE_CONTROLS.map((control) => (
              <label key={control.key}>
                <span>{control.label}<output>{perspectiveConfig[control.key].toFixed(control.step < .1 ? 2 : control.step < 1 ? 1 : 0)}{control.suffix}</output></span>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={perspectiveConfig[control.key]}
                  onChange={(event) => updatePerspective(control.key, Number(event.currentTarget.value))}
                />
              </label>
            ))}
          </div>
          <div className={styles.perspectiveConfiguratorActions}>
            <button type="button" onClick={savePerspective}>Lokal speichern</button>
            <button type="button" onClick={copyPerspective}>Konfiguration kopieren</button>
            <button type="button" onClick={resetPerspective}>Zurücksetzen</button>
            <button type="button" onClick={closePerspectiveEditor}>Editor schließen</button>
          </div>
          <small className={styles.perspectiveConfiguratorStatus} aria-live="polite">{editorStatus}</small>
        </aside>
      )}
    </section>
  );
}

export function MarketingEngine({ lang }: { lang: 'de' | 'en' }) {
  const channels = lang === 'de'
    ? [['Suche', Search], ['Social', Users], ['Content', FileText], ['Kampagnen', Activity], ['Empfehlungen', Sparkles]] as const
    : [['Search', Search], ['Social', Users], ['Content', FileText], ['Campaigns', Activity], ['Referrals', Sparkles]] as const;
  const process = lang === 'de' ? ['Erfassen', 'Qualifizieren', 'CRM', 'Follow-up', 'Conversion', 'Analyse'] : ['Capture', 'Qualify', 'CRM', 'Follow-up', 'Conversion', 'Analyse'];

  return (
    <div className={styles.marketingEngine} aria-label={lang === 'de' ? 'Marketingkanäle führen in ein gemeinsames Lead-System' : 'Marketing channels feed one shared lead system'}>
      <div className={styles.channelFan}>
        {channels.map(([label, Icon], index) => (
          <div key={label} style={{ '--i': index } as CSSProperties}><Icon size={17} /><span>{label}</span></div>
        ))}
      </div>
      <div className={styles.leadCore}>
        <span><Globe2 size={22} /></span>
        <strong>{lang === 'de' ? 'LEAD SYSTEM' : 'LEAD SYSTEM'}</strong>
        <small>{lang === 'de' ? 'Eine gemeinsame Pipeline' : 'One shared pipeline'}</small>
      </div>
      <div className={styles.processRail}>
        {process.map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}
      </div>
    </div>
  );
}

export function DashboardMockup({ lang }: { lang: 'de' | 'en' }) {
  const metrics = lang === 'de'
    ? [['Offene Leads', '12'], ['Aktive Projekte', '06'], ['Offene Aufgaben', '18'], ['Forecast', 'Szenario A']]
    : [['Open leads', '12'], ['Active projects', '06'], ['Open tasks', '18'], ['Forecast', 'Scenario A']];
  return (
    <div className={styles.dashboard} aria-label={lang === 'de' ? 'Demonstrationsdashboard mit Beispieldaten' : 'Demonstration dashboard with sample data'}>
      <header>
        <div><span className={styles.dashboardMark}>MS</span><strong>BUSINESS OS</strong></div>
        <span className={styles.demoBadge}>{lang === 'de' ? 'DEMODATEN' : 'DEMO DATA'}</span>
      </header>
      <div className={styles.dashboardBody}>
        <aside aria-hidden="true">
          {[Activity, Users, Workflow, Database, Mail].map((Icon, index) => <span key={index} className={index === 0 ? styles.activeIcon : ''}><Icon size={16} /></span>)}
        </aside>
        <div className={styles.dashboardMain}>
          <div className={styles.metricGrid}>
            {metrics.map(([label, value], index) => <div key={label}><small>{label}</small><strong>{value}</strong><i style={{ '--w': `${46 + index * 13}%` } as CSSProperties} /></div>)}
          </div>
          <div className={styles.dashboardLower}>
            <div className={styles.chartPanel}>
              <div><small>{lang === 'de' ? 'Pipeline · 90 Tage' : 'Pipeline · 90 days'}</small><span>LIVE</span></div>
              <svg viewBox="0 0 560 170" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9b95e" stopOpacity=".38" /><stop offset="1" stopColor="#d9b95e" stopOpacity="0" /></linearGradient></defs>
                <path className={styles.chartArea} d="M0 155 C55 150 72 124 121 130 C175 136 178 94 230 104 C285 114 310 58 365 73 C425 90 448 30 560 20 L560 170 L0 170Z" />
                <path className={styles.chartLine} d="M0 155 C55 150 72 124 121 130 C175 136 178 94 230 104 C285 114 310 58 365 73 C425 90 448 30 560 20" />
              </svg>
            </div>
            <div className={styles.activityPanel}>
              <small>{lang === 'de' ? 'SYSTEMAKTIVITÄT' : 'SYSTEM ACTIVITY'}</small>
              {[
                lang === 'de' ? 'Anfrage qualifiziert' : 'Enquiry qualified',
                lang === 'de' ? 'Offerte freigegeben' : 'Quote approved',
                lang === 'de' ? 'Projekt aktualisiert' : 'Project updated',
              ].map((item, index) => <span key={item}><i className={index === 0 ? styles.liveDot : ''} /><b>{item}</b><em>{index + 2}m</em></span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArchitectureStack({ lang }: { lang: 'de' | 'en' }) {
  const layers = lang === 'de'
    ? [['01', 'Erlebnis', 'Website · Portal · Mobile'], ['02', 'Schnittstellen', 'API · Webhooks · Integrationen'], ['03', 'Logik', 'Prozesse · Rollen · Automation'], ['04', 'Daten', 'PostgreSQL · Dokumente · Analytics']]
    : [['01', 'Experience', 'Website · Portal · Mobile'], ['02', 'Interfaces', 'API · Webhooks · Integrations'], ['03', 'Logic', 'Processes · Roles · Automation'], ['04', 'Data', 'PostgreSQL · Documents · Analytics']];
  return (
    <div className={styles.architectureStack}>
      <div className={styles.architectureHalo} aria-hidden="true"><ShieldCheck size={35} /><LockKeyhole size={18} /></div>
      {layers.map(([num, title, tech], index) => (
        <div key={num} style={{ '--i': index } as CSSProperties}>
          <span>{num}</span><strong>{title}</strong><small>{tech}</small>
        </div>
      ))}
      <div className={styles.architectureSignal} aria-hidden="true"><Bot size={18} /></div>
    </div>
  );
}
