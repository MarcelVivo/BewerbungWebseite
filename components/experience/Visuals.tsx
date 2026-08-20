'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Activity, ArrowLeft, ArrowRight, Bot, Check, ChevronDown, Database, FileText, Globe2, LockKeyhole, Mail, MousePointerClick, Search, ShieldCheck, Sparkles, Users, Workflow, X } from 'lucide-react';
import styles from './experience.module.css';

type PerspectivePoint = { x: number; y: number };
type SalesPerspectiveQuad = [PerspectivePoint, PerspectivePoint, PerspectivePoint, PerspectivePoint];

const PERSPECTIVE_SOURCE_WIDTH = 1000;
const PERSPECTIVE_SOURCE_HEIGHT = 360;
const DEFAULT_SALES_PERSPECTIVE: SalesPerspectiveQuad = [
  { x: 20.703125, y: 38.12858052196054 },
  { x: 61.09375, y: 49.39528962444303 },
  { x: 61.05468750000001, y: 79.88542329726289 },
  { x: 21.5625, y: 63.14449395289624 },
];

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
  insights,
  active,
  onSelect,
  detailLabel,
  closeLabel,
  lang,
}: {
  steps: readonly string[];
  details: readonly string[];
  insights: ReadonlyArray<Readonly<{ result: string; automation: string; value: string }>>;
  active: number;
  onSelect: (index: number) => void;
  detailLabel: string;
  closeLabel: string;
  lang: 'de' | 'en';
}) {
  const [selectedFlow, setSelectedFlow] = useState<number | null>(null);
  const perspectiveConfig = DEFAULT_SALES_PERSPECTIVE;
  const [sectionSize, setSectionSize] = useState({ width: 0, height: 0 });
  const perspectiveSectionRef = useRef<HTMLElement | null>(null);
  const detailPanelRef = useRef<HTMLElement | null>(null);
  const flowCardRefs = useRef<Array<HTMLButtonElement | null>>([]);

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

  useEffect(() => {
    if (selectedFlow === null) return;

    const routeClickToCard = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const cardIndex = flowCardRefs.current.findIndex((card) => {
        if (!card) return false;
        const rect = card.getBoundingClientRect();
        return event.clientX >= rect.left
          && event.clientX <= rect.right
          && event.clientY >= rect.top
          && event.clientY <= rect.bottom;
      });
      if (cardIndex < 0) return;

      event.preventDefault();
      event.stopPropagation();
      onSelect(cardIndex);
      setSelectedFlow(cardIndex);
    };

    window.addEventListener('click', routeClickToCard, true);
    return () => window.removeEventListener('click', routeClickToCard, true);
  }, [onSelect, selectedFlow]);

  useEffect(() => {
    const panel = detailPanelRef.current;
    if (selectedFlow === null || !panel) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;

    let stopped = false;
    let timer = 0;
    let movement: Animation | null = null;
    let current = { x: 0, y: 0 };
    const organicOffset = (spread: number) => (Math.random() + Math.random() + Math.random() - 1.5) * spread;

    const drift = () => {
      if (stopped) return;
      // A damped random walk keeps the card near its designed position
      // without ever tracing a repeated path or visibly touching a limit.
      const target = {
        x: current.x * .38 + organicOffset(7.5),
        y: current.y * .34 + organicOffset(5.8) - .7,
      };
      const duration = 3000 + Math.random() * 2800;

      movement = panel.animate(
        [
          { translate: `${current.x.toFixed(2)}px ${current.y.toFixed(2)}px` },
          { translate: `${target.x.toFixed(2)}px ${target.y.toFixed(2)}px` },
        ],
        { duration, easing: 'cubic-bezier(.42, 0, .28, 1)', fill: 'forwards' },
      );
      current = target;
      movement.onfinish = () => {
        timer = window.setTimeout(drift, 120 + Math.random() * 620);
      };
    };

    timer = window.setTimeout(drift, 480);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      movement?.cancel();
    };
  }, [selectedFlow]);

  const planeTransform = createPerspectiveMatrix(perspectiveConfig, sectionSize.width, sectionSize.height);
  const gridStyle = {
    left: 0,
    top: 0,
    width: `${PERSPECTIVE_SOURCE_WIDTH}px`,
    height: `${PERSPECTIVE_SOURCE_HEIGHT}px`,
    transform: planeTransform,
    transformOrigin: '0 0',
  } as CSSProperties;

  const selectFlow = (index: number) => {
    onSelect(index);
    setSelectedFlow((current) => current === index ? null : index);
  };

  const showFlow = (index: number) => {
    onSelect(index);
    setSelectedFlow(index);
  };

  const previousFlow = selectedFlow === null ? null : steps[(selectedFlow - 1 + steps.length) % steps.length];
  const nextFlow = selectedFlow === null ? null : steps[(selectedFlow + 1) % steps.length];

  return (
    <section ref={perspectiveSectionRef} className={`${styles.perspectiveFlow} ${selectedFlow !== null ? styles.perspectiveFlowOpen : ''}`} aria-label={lang === 'de' ? 'Interaktiver Verkaufsprozess mit zehn Schritten' : 'Interactive ten-step sales process'} onKeyDown={(event) => {
      if (event.key === 'Escape') setSelectedFlow(null);
    }}>
      <div className={styles.perspectiveFlowStage}>
        <div
          className={`${styles.perspectiveFlowCardGrid} ${selectedFlow !== null ? styles.perspectiveFlowCardGridOpen : ''}`}
          style={gridStyle}
          data-interaction-hint={lang === 'de' ? 'KARTE WÄHLEN · DETAILS ÖFFNEN' : 'SELECT CARD · OPEN DETAILS'}
        >
          {steps.map((step, index) => {
            const selected = selectedFlow === index;
            return (
              <button
                key={step}
                ref={(element) => { flowCardRefs.current[index] = element; }}
                type="button"
                className={`${styles.perspectiveFlowNode} ${index <= active ? styles.perspectiveFlowReached : ''} ${selected ? styles.perspectiveFlowSelected : ''}`}
                style={{
                  '--flow-index': index,
                  '--flow-sequence-delay': `${index * .2}s`,
                } as CSSProperties}
                aria-current={active === index ? 'step' : undefined}
                aria-expanded={selected}
                aria-controls="perspective-flow-detail-panel"
                aria-label={`${String(index + 1).padStart(2, '0')} · ${step}`}
                data-flow-index={index}
                onClick={() => selectFlow(index)}
              >
                <span className={styles.perspectiveFlowCardHead}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <strong>{step}</strong>
                  <i aria-hidden="true"><MousePointerClick size={13} /></i>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedFlow !== null && (
        <aside
          ref={detailPanelRef}
          id="perspective-flow-detail-panel"
          className={styles.perspectiveFlowDetailPanel}
          style={{
            '--detail-plane-transform': planeTransform === 'none'
              ? 'translate3d(1050px, -300px, 0)'
              : `${planeTransform} translate3d(1050px, -300px, 0)`,
          } as CSSProperties}
          aria-live="polite"
        >
          <header>
            <span><i />{detailLabel}</span>
            <button type="button" onClick={() => setSelectedFlow(null)} aria-label={closeLabel}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className={styles.perspectiveFlowDetailIdentity}>
            <div className={styles.perspectiveFlowDetailIndex}>
              <strong>{String(selectedFlow + 1).padStart(2, '0')}</strong>
              <span>/ {String(steps.length).padStart(2, '0')}</span>
            </div>
            <h3>{steps[selectedFlow]}</h3>
          </div>
          <p>{details[selectedFlow]}</p>
          <div className={styles.perspectiveFlowDetailInsights}>
            <div><small>{lang === 'de' ? 'ERGEBNIS' : 'OUTCOME'}</small><strong>{insights[selectedFlow].result}</strong></div>
            <div><small>{lang === 'de' ? 'AUTOMATISIERUNG' : 'AUTOMATION'}</small><strong>{insights[selectedFlow].automation}</strong></div>
            <div><small>{lang === 'de' ? 'MEHRWERT' : 'VALUE'}</small><strong>{insights[selectedFlow].value}</strong></div>
          </div>
          <div className={styles.perspectiveFlowDetailContext}>
            <small>{lang === 'de' ? 'IM ABLAUF' : 'IN THE FLOW'}</small>
            <div>
              <span><small>{lang === 'de' ? 'DAVOR' : 'BEFORE'}</small>{previousFlow}</span>
              <strong><small>{lang === 'de' ? 'AKTIV' : 'ACTIVE'}</small>{steps[selectedFlow]}</strong>
              <span><small>{lang === 'de' ? 'DANACH' : 'NEXT'}</small>{nextFlow}</span>
            </div>
          </div>
          <footer>
            <span><i style={{ width: `${((selectedFlow + 1) / steps.length) * 100}%` }} /></span>
            <div>
              <button type="button" onClick={() => showFlow((selectedFlow - 1 + steps.length) % steps.length)} aria-label={lang === 'de' ? 'Vorheriger Schritt' : 'Previous step'}>
                <ArrowLeft size={19} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => showFlow((selectedFlow + 1) % steps.length)} aria-label={lang === 'de' ? 'Nächster Schritt' : 'Next step'}>
                <ArrowRight size={19} aria-hidden="true" />
              </button>
            </div>
          </footer>
        </aside>
      )}

    </section>
  );
}

export function MarketingEngine({ lang }: { lang: 'de' | 'en' }) {
  const [activeChannel, setActiveChannel] = useState(0);
  const channels = lang === 'de'
    ? [
      {
        label: 'Suche', Icon: Search,
        title: 'Gefunden werden, wenn Bedarf entsteht.',
        text: 'Klare Angebotsseiten, lokaler Kontext und suchfähige Inhalte führen Interessierte direkt zur passenden Leistung.',
        details: ['Bedarf und Suchbegriff bleiben sichtbar', 'Die Anfrage landet beim richtigen Angebot', 'SEO und AI-Suche nutzen dieselbe Struktur'],
        result: 'Aus einer Suche wird eine konkrete Anfrage.',
        flow: ['Gefunden', 'Anfrage', 'Antwort'],
      },
      {
        label: 'Social', Icon: Users,
        title: 'Aus Aufmerksamkeit wird ein bekannter Kontakt.',
        text: 'Beiträge und Profile führen nicht in eine Sackgasse, sondern in einen passenden nächsten Schritt mit klarer Herkunft.',
        details: ['Kanal und Beitrag bleiben zugeordnet', 'Kontaktwege passen zur Kampagne', 'Follow-ups gehen nicht vergessen'],
        result: 'Interesse wird erfassbar und kann weitergeführt werden.',
        flow: ['Interesse', 'Kontakt', 'Nächster Schritt'],
      },
      {
        label: 'Content', Icon: FileText,
        title: 'Antworten schaffen Vertrauen vor dem Gespräch.',
        text: 'Hilfreiche Inhalte beantworten echte Kundenfragen und führen genau dort weiter, wo persönliche Beratung sinnvoll wird.',
        details: ['Inhalte lösen konkrete Fragen', 'Passende Leistungen werden verknüpft', 'Wissen arbeitet über mehrere Kanäle'],
        result: 'Aus Information entsteht eine fundierte Entscheidung.',
        flow: ['Frage', 'Antwort', 'Entscheidung'],
      },
      {
        label: 'Kampagnen', Icon: Activity,
        title: 'Budget folgt dem Ergebnis, nicht nur dem Klick.',
        text: 'Landingpage, Anfrage und Auftrag bleiben verbunden. So wird sichtbar, welche Kampagne tatsächlich Geschäft erzeugt.',
        details: ['Klick und Anfrage bleiben verbunden', 'Kosten werden dem Ergebnis zugeordnet', 'Gute Kampagnen lassen sich gezielt stärken'],
        result: 'Werbebudget wird nach Wirkung gesteuert.',
        flow: ['Kampagne', 'Anfrage', 'Auftrag'],
      },
      {
        label: 'Empfehlungen', Icon: Sparkles,
        title: 'Empfehlungen bekommen einen klaren Weg.',
        text: 'Persönlich empfohlene Kontakte landen mit Kontext, Zuständigkeit und nächstem Schritt direkt im richtigen Prozess.',
        details: ['Empfehlungsquelle bleibt bekannt', 'Anliegen und Kontext gehen nicht verloren', 'Eine persönliche Reaktion wird planbar'],
        result: 'Vertrauen wird ohne Reibungsverlust weitergeführt.',
        flow: ['Empfehlung', 'Kontakt', 'Gespräch'],
      },
    ]
    : [
      {
        label: 'Search', Icon: Search,
        title: 'Be found when a real need appears.',
        text: 'Clear service pages, local context and searchable content guide interested people directly to the right offer.',
        details: ['Need and search term remain visible', 'The enquiry reaches the right service', 'SEO and AI search use one structure'],
        result: 'A search becomes a concrete enquiry.',
        flow: ['Found', 'Enquiry', 'Response'],
      },
      {
        label: 'Social', Icon: Users,
        title: 'Attention becomes a known contact.',
        text: 'Posts and profiles lead to a useful next step while the original channel and context remain visible.',
        details: ['Channel and post remain attributed', 'Contact paths fit the campaign', 'Follow-ups are not forgotten'],
        result: 'Interest becomes traceable and actionable.',
        flow: ['Interest', 'Contact', 'Next step'],
      },
      {
        label: 'Content', Icon: FileText,
        title: 'Answers build trust before the conversation.',
        text: 'Helpful content answers real customer questions and moves people forward when personal guidance becomes useful.',
        details: ['Content solves concrete questions', 'Relevant services are connected', 'Knowledge works across channels'],
        result: 'Information supports a confident decision.',
        flow: ['Question', 'Answer', 'Decision'],
      },
      {
        label: 'Campaigns', Icon: Activity,
        title: 'Budget follows outcomes, not just clicks.',
        text: 'Landing page, enquiry and order remain connected, revealing which campaigns actually create business.',
        details: ['Click and enquiry stay connected', 'Cost is tied to the outcome', 'Effective campaigns can be strengthened'],
        result: 'Advertising spend is steered by impact.',
        flow: ['Campaign', 'Enquiry', 'Order'],
      },
      {
        label: 'Referrals', Icon: Sparkles,
        title: 'Referrals get a clear path forward.',
        text: 'Referred contacts enter the right process with context, ownership and a useful next step.',
        details: ['The referral source remains known', 'Context does not get lost', 'A personal response becomes reliable'],
        result: 'Trust moves forward without friction.',
        flow: ['Referral', 'Contact', 'Conversation'],
      },
    ];
  const selected = channels[activeChannel];
  const SelectedIcon = selected.Icon;

  return (
    <div className={styles.marketingEngine} aria-label={lang === 'de' ? 'Interaktive Übersicht der Marketingkanäle' : 'Interactive overview of marketing channels'}>
      <header className={styles.marketingEngineIntro}>
        <div>
          <span>{lang === 'de' ? 'KANAL WÄHLEN' : 'CHOOSE A CHANNEL'}</span>
          <strong>{lang === 'de' ? 'So wird Sichtbarkeit zu einem nächsten Schritt.' : 'See how visibility becomes a next step.'}</strong>
        </div>
        <small>{String(activeChannel + 1).padStart(2, '0')} / 05</small>
      </header>

      <div className={styles.channelFan} role="tablist" aria-label={lang === 'de' ? 'Marketingkanal wählen' : 'Choose a marketing channel'}>
        {channels.map(({ label, Icon }, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`marketing-channel-${index}`}
            aria-selected={activeChannel === index}
            aria-controls="marketing-channel-detail"
            data-active={activeChannel === index ? 'true' : 'false'}
            onClick={() => setActiveChannel(index)}
          >
            <Icon size={18} />
            <span>{label}</span>
            <i>{String(index + 1).padStart(2, '0')}</i>
          </button>
        ))}
      </div>

      <div className={styles.marketingEngineBody}>
        <article
          id="marketing-channel-detail"
          role="tabpanel"
          aria-labelledby={`marketing-channel-${activeChannel}`}
          className={styles.marketingChannelDetail}
        >
          <header><span><SelectedIcon size={20} /></span><small>{lang === 'de' ? 'AUSGEWÄHLTER KANAL' : 'SELECTED CHANNEL'}</small></header>
          <h3>{selected.title}</h3>
          <p>{selected.text}</p>
          <ul>
            {selected.details.map((detail) => <li key={detail}><Check size={14} />{detail}</li>)}
          </ul>
        </article>

        <aside className={styles.marketingOutcome} aria-label={lang === 'de' ? 'Ergebnis und Ablauf' : 'Outcome and flow'}>
          <span>{lang === 'de' ? 'WAS ENTSTEHT?' : 'WHAT DOES THIS CREATE?'}</span>
          <strong>{selected.result}</strong>
          <div className={styles.marketingOutcomeFlow}>
            {selected.flow.map((step, index) => (
              <div key={step}><i>{index + 1}</i><span>{step}</span>{index < selected.flow.length - 1 && <b aria-hidden="true">→</b>}</div>
            ))}
          </div>
        </aside>
      </div>

      <footer className={styles.marketingEngineFooter}>
        <span><i />{lang === 'de' ? 'Quelle sichtbar' : 'Source visible'}</span>
        <span><i />{lang === 'de' ? 'Nächster Schritt klar' : 'Next step clear'}</span>
        <span><i />{lang === 'de' ? 'Ergebnis messbar' : 'Outcome measurable'}</span>
      </footer>
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
