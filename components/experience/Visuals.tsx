'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { Activity, ArrowRight, Bot, Check, ChevronDown, Database, FileText, Globe2, LockKeyhole, Mail, Search, ShieldCheck, Sparkles, Users, Workflow } from 'lucide-react';
import styles from './experience.module.css';

type PerspectivePoint = { x: number; y: number };
type SalesPerspectiveQuad = [PerspectivePoint, PerspectivePoint, PerspectivePoint, PerspectivePoint];

const SALES_PERSPECTIVE_STORAGE_KEY = 'ms-sales-perspective-quad-v1';
const PERSPECTIVE_SOURCE_WIDTH = 1000;
const PERSPECTIVE_SOURCE_HEIGHT = 360;
const PERSPECTIVE_CORNER_LABELS = ['Oben links', 'Oben rechts', 'Unten rechts', 'Unten links'] as const;
const DEFAULT_SALES_PERSPECTIVE: SalesPerspectiveQuad = [
  { x: 20.703125, y: 38.12858052196054 },
  { x: 61.09375, y: 49.39528962444303 },
  { x: 61.05468750000001, y: 79.88542329726289 },
  { x: 21.5625, y: 63.14449395289624 },
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
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const stages = lang === 'de'
    ? [
      {
        label: 'Anfragen', value: '12', conversion: '100%', context: 'Neu eingegangen',
        detail: 'Alle neuen Kontakte werden mit Quelle, Anliegen und Reaktionsstatus zentral erfasst.',
        features: ['Quelle und Interesse', 'Zuständige Person', 'Antwortstatus und Frist'],
        insight: '3 Anfragen benötigen heute eine erste Reaktion.',
      },
      {
        label: 'Qualifiziert', value: '07', conversion: '58%', context: 'CHF 48’600 Gesamtpotenzial',
        detail: 'Diese Kontakte passen fachlich und wirtschaftlich. Bedarf, Budget und Entscheidungsfenster sind geklärt.',
        features: ['Bedarf und Priorität', 'Budgetrahmen', 'Entscheidung und Zeitfenster'],
        insight: '58% der Anfragen werden zu realistischen Verkaufschancen.',
      },
      {
        label: 'Offerten', value: '04', conversion: '33%', context: 'CHF 23’800 in Prüfung',
        detail: 'Vier konkrete Angebote befinden sich beim Kunden. Wert, Wahrscheinlichkeit und nächster Kontakt sind sichtbar.',
        features: ['Offertwert und Version', 'Abschlusswahrscheinlichkeit', 'Nächster Follow-up-Termin'],
        insight: '2 Offerten benötigen diese Woche ein Follow-up.',
      },
      {
        label: 'Gewonnen', value: '02', conversion: '17%', context: 'CHF 21’400 bestätigt',
        detail: 'Gewonnene Aufträge werden ohne erneute Dateneingabe an Projektplanung und Abrechnung übergeben.',
        features: ['Projektübergabe', 'Verantwortlichkeiten', 'Termine und Rechnungsplan'],
        insight: 'Beide Aufträge sind vollständig zur Umsetzung übergeben.',
      },
    ]
    : [
      {
        label: 'Enquiries', value: '12', conversion: '100%', context: 'Newly received',
        detail: 'Every new contact is captured centrally with its source, need and response status.',
        features: ['Source and interest', 'Responsible owner', 'Response status and deadline'],
        insight: '3 enquiries need an initial response today.',
      },
      {
        label: 'Qualified', value: '07', conversion: '58%', context: 'CHF 48,600 total potential',
        detail: 'These contacts are a commercial and functional fit. Need, budget and decision window are understood.',
        features: ['Need and priority', 'Budget range', 'Decision and timeframe'],
        insight: '58% of enquiries become realistic sales opportunities.',
      },
      {
        label: 'Quotes', value: '04', conversion: '33%', context: 'CHF 23,800 under review',
        detail: 'Four concrete proposals are with customers. Value, probability and the next contact remain visible.',
        features: ['Quote value and version', 'Close probability', 'Next follow-up date'],
        insight: '2 quotes require a follow-up this week.',
      },
      {
        label: 'Won', value: '02', conversion: '17%', context: 'CHF 21,400 confirmed',
        detail: 'Won orders move into project planning and billing without entering the same information again.',
        features: ['Project handover', 'Responsibilities', 'Schedule and billing plan'],
        insight: 'Both orders have been handed over for delivery.',
      },
    ];
  const actions = lang === 'de'
    ? [
      ['Offerte nachfassen', 'Meier AG', 'HEUTE'],
      ['Erstgespräch vorbereiten', 'Nova GmbH', 'MORGEN'],
      ['Projektübergabe bestätigen', 'VeraHome', 'FR · 10:00'],
    ]
    : [
      ['Follow up quote', 'Meier AG', 'TODAY'],
      ['Prepare discovery call', 'Nova GmbH', 'TOMORROW'],
      ['Confirm project handover', 'VeraHome', 'FRI · 10:00'],
    ];
  return (
    <div className={styles.dashboard} aria-label={lang === 'de' ? 'Demonstrationsdashboard mit Beispieldaten' : 'Demonstration dashboard with sample data'}>
      <header>
        <div><span className={styles.dashboardMark}>MS</span><strong>{lang === 'de' ? 'VERKAUF · LIVE' : 'SALES · LIVE'}</strong></div>
        <span className={styles.demoBadge}>{lang === 'de' ? 'BEISPIEL · HEUTE' : 'SAMPLE · TODAY'}</span>
      </header>
      <div className={styles.dashboardBody}>
        <aside aria-hidden="true">
          {[Activity, Users, Workflow, Database, Mail].map((Icon, index) => <span key={index} className={index === 0 ? styles.activeIcon : ''}><Icon size={16} /></span>)}
        </aside>
        <div className={styles.dashboardMain}>
          <header className={styles.dashboardStoryHeader}>
            <div><small>{lang === 'de' ? 'VERKAUFSTRICHTER · LETZTE 30 TAGE' : 'SALES FUNNEL · LAST 30 DAYS'}</small><span><i /> LIVE</span></div>
            <h3>{lang === 'de' ? 'Vom Erstkontakt zum Auftrag.' : 'From first contact to order.'}</h3>
            <p>{lang === 'de' ? 'Jede Zahl gehört zum selben Prozess. So werden Engpässe, Potenzial und nächste Schritte sofort sichtbar.' : 'Every figure belongs to the same process, making bottlenecks, potential and next steps immediately visible.'}</p>
          </header>
          <ol className={styles.dashboardPipeline}>
            {stages.map((stage, index) => {
              const isOpen = activeStage === index;
              const detailId = `dashboard-stage-${index + 1}`;
              return <li key={stage.label} className={isOpen ? styles.dashboardPipelineOpen : ''}>
                <button type="button" className={styles.dashboardPipelineToggle} aria-expanded={isOpen} aria-controls={detailId} onClick={() => setActiveStage((current) => current === index ? null : index)}>
                  <div><small>0{index + 1}</small><span>{stage.conversion}</span></div>
                  <strong>{stage.value}</strong>
                  <h4>{stage.label}</h4>
                  <p>{stage.context}</p>
                  <i style={{ '--stage-width': stage.conversion } as CSSProperties} />
                  <b aria-hidden="true"><ChevronDown size={14} /></b>
                </button>
                <div id={detailId} className={styles.dashboardPipelineDetail} aria-hidden={!isOpen}>
                  <p>{stage.detail}</p>
                  <ul>{stage.features.map((feature) => <li key={feature}><Check size={11} />{feature}</li>)}</ul>
                  <footer><small>{lang === 'de' ? 'EINORDNUNG' : 'INSIGHT'}</small><strong>{stage.insight}</strong></footer>
                </div>
                {index < stages.length - 1 && <ArrowRight className={styles.dashboardPipelineConnector} size={14} aria-hidden="true" />}
              </li>
            })}
          </ol>
          <div className={styles.dashboardLower}>
            <section className={styles.forecastPanel}>
              <header><small>{lang === 'de' ? 'GEWICHTETER FORECAST' : 'WEIGHTED FORECAST'}</small><span>{lang === 'de' ? '79% DES MONATSZIELS' : '79% OF MONTHLY TARGET'}</span></header>
              <strong>CHF 31’600</strong>
              <div className={styles.forecastProgress}><i /></div>
              <dl>
                <div><dt>{lang === 'de' ? 'Pipeline' : 'Pipeline'}</dt><dd>CHF 48’600</dd></div>
                <div><dt>{lang === 'de' ? 'Gewonnen' : 'Won'}</dt><dd>CHF 21’400</dd></div>
                <div><dt>{lang === 'de' ? 'Monatsziel' : 'Monthly target'}</dt><dd>CHF 40’000</dd></div>
              </dl>
            </section>
            <div className={styles.activityPanel}>
              <small>{lang === 'de' ? 'NÄCHSTE AKTIONEN' : 'NEXT ACTIONS'}</small>
              {actions.map(([action, account, due], index) => <span key={action}><i className={index === 0 ? styles.liveDot : ''} /><b>{action}<small>{account}</small></b><em>{due}</em></span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArchitectureStack({ lang }: { lang: 'de' | 'en' }) {
  const [activeLayer, setActiveLayer] = useState<number | null>(0);
  const layers = lang === 'de'
    ? [
      {
        number: '01', title: 'Erlebnis', tech: 'Website · Portal · Mobile', Icon: Globe2,
        detail: 'Kundinnen, Kunden und Mitarbeitende erfassen Informationen dort, wo sie entstehen – verständlich, responsiv und ohne doppelte Eingaben.',
        value: 'Weniger Reibung, bessere Datenqualität und ein konsistenter Auftritt auf jedem Gerät.',
      },
      {
        number: '02', title: 'Schnittstellen', tech: 'API · Webhooks · Integrationen', Icon: Workflow,
        detail: 'Bestehende Werkzeuge tauschen Daten kontrolliert aus. Änderungen werden automatisch an die richtigen Systeme weitergegeben.',
        value: 'Keine Copy-paste-Prozesse, weniger Fehler und aktuelle Informationen über Systemgrenzen hinweg.',
      },
      {
        number: '03', title: 'Geschäftslogik', tech: 'Prozesse · Rollen · Automation', Icon: Bot,
        detail: 'Regeln, Freigaben und Automationen bilden den tatsächlichen Arbeitsablauf ab. AI unterstützt klar definierte Schritte mit menschlicher Kontrolle.',
        value: 'Wiederholbare Abläufe, klare Verantwortung und schnellere Bearbeitung ohne Kontrollverlust.',
      },
      {
        number: '04', title: 'Datengrundlage', tech: 'PostgreSQL · Dokumente · Analytics', Icon: Database,
        detail: 'Strukturierte Daten, Dokumente und Ereignisse liegen in einer gemeinsamen, abgesicherten Quelle mit Rollen, Historie und Backups.',
        value: 'Verlässliche Kennzahlen und Entscheidungen auf Basis derselben aktuellen Wahrheit.',
      },
    ]
    : [
      {
        number: '01', title: 'Experience', tech: 'Website · Portal · Mobile', Icon: Globe2,
        detail: 'Customers and employees capture information where it originates, through clear responsive interfaces without duplicate entry.',
        value: 'Less friction, better data quality and one consistent experience on every device.',
      },
      {
        number: '02', title: 'Interfaces', tech: 'API · Webhooks · Integrations', Icon: Workflow,
        detail: 'Existing tools exchange data in a controlled way. Changes are automatically delivered to the systems that need them.',
        value: 'No copy-and-paste processes, fewer errors and current information across system boundaries.',
      },
      {
        number: '03', title: 'Business logic', tech: 'Processes · Roles · Automation', Icon: Bot,
        detail: 'Rules, approvals and automation reflect the real workflow. AI supports clearly defined steps under human control.',
        value: 'Repeatable operations, clear ownership and faster delivery without losing control.',
      },
      {
        number: '04', title: 'Data foundation', tech: 'PostgreSQL · Documents · Analytics', Icon: Database,
        detail: 'Structured data, documents and events live in one secured source with roles, history and backups.',
        value: 'Dependable metrics and decisions based on the same current source of truth.',
      },
    ];
  return (
    <div className={styles.architectureStack} aria-label={lang === 'de' ? 'Vier Ebenen eines verbundenen digitalen Systems' : 'Four layers of a connected digital system'}>
      <header className={styles.architectureHeader}>
        <small>{lang === 'de' ? 'EIN DATENFLUSS · VIER EBENEN' : 'ONE DATA FLOW · FOUR LAYERS'}</small>
        <strong>{lang === 'de' ? 'Vom Kontaktpunkt zur verlässlichen Entscheidung.' : 'From touchpoint to dependable decision.'}</strong>
      </header>
      <ol className={styles.architectureLayers}>
        {layers.map(({ number, title, tech, Icon, detail, value }, index) => {
          const isOpen = activeLayer === index;
          const detailId = `architecture-layer-${index + 1}`;
          return (
            <li key={number} className={isOpen ? styles.architectureLayerOpen : ''}>
              <button type="button" className={styles.architectureLayerToggle} aria-expanded={isOpen} aria-controls={detailId} onClick={() => setActiveLayer((current) => current === index ? null : index)}>
                <span>{number}</span>
                <i><Icon size={17} /></i>
                <span><strong>{title}</strong><small>{tech}</small></span>
                <b aria-hidden="true"><ChevronDown size={15} /></b>
              </button>
              <div id={detailId} className={styles.architectureLayerDetail} aria-hidden={!isOpen}>
                <p>{detail}</p>
                <footer><small>{lang === 'de' ? 'MEHRWERT' : 'VALUE'}</small><strong>{value}</strong></footer>
              </div>
              {index < layers.length - 1 && <span className={styles.architectureConnector} aria-hidden="true"><i /><ArrowRight size={13} /></span>}
            </li>
          );
        })}
      </ol>
      <div className={styles.architectureTrust}>
        <span><ShieldCheck size={22} /><LockKeyhole size={12} /></span>
        <div><small>{lang === 'de' ? 'SICHERHEIT ÜBER ALLE EBENEN' : 'SECURITY ACROSS EVERY LAYER'}</small><strong>{lang === 'de' ? 'Rollen, Protokollierung, Verschlüsselung und Backups sind Teil des Systems – kein Zusatz.' : 'Roles, audit trails, encryption and backups are part of the system, not an add-on.'}</strong></div>
      </div>
    </div>
  );
}
