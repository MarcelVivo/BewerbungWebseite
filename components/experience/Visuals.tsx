'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Activity, ArrowRight, Bot, Check, Database, FileText, Globe2, LockKeyhole, Mail, Search, ShieldCheck, Sparkles, Users, Workflow } from 'lucide-react';
import styles from './experience.module.css';

type PerspectivePoint = { x: number; y: number };
type SalesPerspectiveQuad = [PerspectivePoint, PerspectivePoint, PerspectivePoint, PerspectivePoint];

const SALES_PERSPECTIVE_STORAGE_KEY = 'ms-sales-perspective-quad-v1';
const PERSPECTIVE_SOURCE_WIDTH = 1000;
const PERSPECTIVE_SOURCE_HEIGHT = 360;
const PERSPECTIVE_CORNER_LABELS = ['Oben links', 'Oben rechts', 'Unten rechts', 'Unten links'] as const;
const DEFAULT_SALES_PERSPECTIVE: SalesPerspectiveQuad = [
  { x: 20.1, y: 38.4 },
  { x: 62.3, y: 49.9 },
  { x: 61.9, y: 81 },
  { x: 21, y: 63.9 },
];

function parseStoredPerspective(value: string | null): SalesPerspectiveQuad | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { points?: PerspectivePoint[] };
    if (!Array.isArray(parsed.points) || parsed.points.length !== 4) return null;
    const points = parsed.points.map((point) => ({
      x: Math.min(98, Math.max(2, Number(point.x))),
      y: Math.min(96, Math.max(4, Number(point.y))),
    }));
    if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return null;
    return points as SalesPerspectiveQuad;
  } catch {
    return null;
  }
}

function createPerspectiveMatrix(points: SalesPerspectiveQuad, width: number, height: number) {
  if (width <= 0 || height <= 0) return 'none';
  const [topLeft, topRight, bottomRight, bottomLeft] = points.map((point) => ({
    x: point.x / 100 * width,
    y: point.y / 100 * height,
  })) as SalesPerspectiveQuad;
  const dx1 = topRight.x - bottomRight.x;
  const dx2 = bottomLeft.x - bottomRight.x;
  const dx3 = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;
  const dy1 = topRight.y - bottomRight.y;
  const dy2 = bottomLeft.y - bottomRight.y;
  const dy3 = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;
  const denominator = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(denominator) < .0001) return 'none';
  const projectiveX = (dx3 * dy2 - dx2 * dy3) / denominator;
  const projectiveY = (dx1 * dy3 - dx3 * dy1) / denominator;
  const scaleX = topRight.x - topLeft.x + projectiveX * topRight.x;
  const shearX = bottomLeft.x - topLeft.x + projectiveY * bottomLeft.x;
  const scaleY = topRight.y - topLeft.y + projectiveX * topRight.y;
  const shearY = bottomLeft.y - topLeft.y + projectiveY * bottomLeft.y;
  return `matrix3d(${[
    scaleX / PERSPECTIVE_SOURCE_WIDTH,
    scaleY / PERSPECTIVE_SOURCE_WIDTH,
    0,
    projectiveX / PERSPECTIVE_SOURCE_WIDTH,
    shearX / PERSPECTIVE_SOURCE_HEIGHT,
    shearY / PERSPECTIVE_SOURCE_HEIGHT,
    0,
    projectiveY / PERSPECTIVE_SOURCE_HEIGHT,
    0, 0, 1, 0,
    topLeft.x,
    topLeft.y,
    0,
    1,
  ].join(',')})`;
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
  const [perspectiveConfig, setPerspectiveConfig] = useState<SalesPerspectiveQuad>(DEFAULT_SALES_PERSPECTIVE);
  const [perspectiveEditor, setPerspectiveEditor] = useState(false);
  const [editorStatus, setEditorStatus] = useState('Ziehe die vier goldenen Eckpunkte direkt auf die Scheibenkanten.');
  const [activeCorner, setActiveCorner] = useState<number | null>(null);
  const [sectionSize, setSectionSize] = useState({ width: 0, height: 0 });
  const perspectiveSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPerspectiveEditor(params.get('perspective-editor') === '1');
    const stored = parseStoredPerspective(window.localStorage.getItem(SALES_PERSPECTIVE_STORAGE_KEY));
    if (stored) setPerspectiveConfig(stored);
  }, []);

  useEffect(() => {
    const section = perspectiveSectionRef.current;
    if (!section) return;
    const updateSize = () => {
      const bounds = section.getBoundingClientRect();
      setSectionSize({ width: bounds.width, height: bounds.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const planeTransform = createPerspectiveMatrix(perspectiveConfig, sectionSize.width, sectionSize.height);
  const topEdgeAngle = sectionSize.width > 0
    ? Math.atan2(
      (perspectiveConfig[1].y - perspectiveConfig[0].y) / 100 * sectionSize.height,
      (perspectiveConfig[1].x - perspectiveConfig[0].x) / 100 * sectionSize.width,
    ) * 180 / Math.PI
    : 0;
  const headerStyle = {
    left: `${perspectiveConfig[0].x}%`,
    top: `${Math.max(2, Math.min(perspectiveConfig[0].y, perspectiveConfig[1].y) - 4.5)}%`,
    width: `${Math.max(18, perspectiveConfig[1].x - perspectiveConfig[0].x)}%`,
    transform: `rotate(${topEdgeAngle}deg)`,
  } as CSSProperties;
  const gridStyle = {
    left: 0,
    top: 0,
    width: `${PERSPECTIVE_SOURCE_WIDTH}px`,
    height: `${PERSPECTIVE_SOURCE_HEIGHT}px`,
    transform: planeTransform,
    transformOrigin: '0 0',
  } as CSSProperties;

  const moveCorner = (index: number, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = perspectiveSectionRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const nextPoint = {
      x: Math.min(98, Math.max(2, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.min(96, Math.max(4, (event.clientY - bounds.top) / bounds.height * 100)),
    };
    setPerspectiveConfig((current) => current.map((point, pointIndex) => pointIndex === index ? nextPoint : point) as SalesPerspectiveQuad);
    setEditorStatus(`${PERSPECTIVE_CORNER_LABELS[index]} angepasst – noch nicht gespeichert.`);
  };

  const startCornerDrag = (index: number, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveCorner(index);
  };

  const stopCornerDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setActiveCorner(null);
  };

  const savePerspective = () => {
    window.localStorage.setItem(SALES_PERSPECTIVE_STORAGE_KEY, JSON.stringify({ version: 1, points: perspectiveConfig }));
    setEditorStatus('Lokal gespeichert – gilt auch ohne Editor-Panel.');
  };

  const copyPerspective = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ version: 1, points: perspectiveConfig }, null, 2));
      setEditorStatus('Konfiguration in die Zwischenablage kopiert.');
    } catch {
      setEditorStatus('Kopieren fehlgeschlagen. Bitte lokal speichern.');
    }
  };

  const resetPerspective = () => {
    setPerspectiveConfig(DEFAULT_SALES_PERSPECTIVE.map((point) => ({ ...point })) as SalesPerspectiveQuad);
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
    <section ref={perspectiveSectionRef} className={styles.perspectiveFlow} aria-label={label} onKeyDown={(event) => {
      if (event.key === 'Escape') setSelectedFlow(null);
    }}>
      <header className={styles.perspectiveFlowHeader} style={headerStyle}>
        <span><i />{label}</span>
        <small>{hint}</small>
      </header>

      <div className={styles.perspectiveFlowStage}>
        <div className={`${styles.perspectiveFlowCardGrid} ${selectedFlow !== null ? styles.perspectiveFlowCardGridOpen : ''}`} style={gridStyle}>
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

      {perspectiveEditor && (
        <div className={styles.perspectiveQuadEditor} aria-label="Vier Eckpunkte der Kartenfläche">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polygon points={perspectiveConfig.map((point) => `${point.x},${point.y}`).join(' ')} />
          </svg>
          {perspectiveConfig.map((point, index) => (
            <button
              key={PERSPECTIVE_CORNER_LABELS[index]}
              type="button"
              className={activeCorner === index ? styles.perspectiveCornerActive : ''}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              aria-label={`${PERSPECTIVE_CORNER_LABELS[index]} ziehen`}
              onPointerDown={(event) => startCornerDrag(index, event)}
              onPointerMove={(event) => moveCorner(index, event)}
              onPointerUp={stopCornerDrag}
              onPointerCancel={stopCornerDrag}
            >
              <span>{index + 1}</span>
              <small>{PERSPECTIVE_CORNER_LABELS[index]}</small>
            </button>
          ))}
        </div>
      )}

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
          <p>Ziehe die vier nummerierten Eckpunkte der Kartenfläche auf die vier Ecken der Glasscheibe. Alle zehn Karten folgen der Fläche projektiv.</p>
          <div className={styles.perspectiveConfiguratorCorners}>
            {perspectiveConfig.map((point, index) => (
              <div key={PERSPECTIVE_CORNER_LABELS[index]}>
                <b>{index + 1}</b>
                <span>{PERSPECTIVE_CORNER_LABELS[index]}</span>
                <output>{point.x.toFixed(1)} / {point.y.toFixed(1)}</output>
              </div>
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
