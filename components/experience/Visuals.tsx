'use client';

import { useState, type CSSProperties } from 'react';
import { Activity, ArrowRight, Bot, Check, Database, FileText, Globe2, LockKeyhole, Mail, Search, ShieldCheck, Sparkles, Users, Workflow } from 'lucide-react';
import styles from './experience.module.css';

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
  const denominator = Math.max(steps.length - 1, 1);
  const progress = active / denominator;
  const portalDepth = .425;
  // Equal distances in the process must compress toward the scene's vanishing
  // point. Keeping them linear made the added cubes read like a flat diagram
  // laid over the cinematic road instead of objects standing inside it.
  const projectDepth = (depth: number) => 1 - Math.pow(1 - depth, 1.5);
  // Calibrated against the luminous floor lane in the foreground and the
  // physical glass blocks in the back of the sales-system artwork. Both the
  // nodes and their rail now share that single scene-space vanishing line.
  const routeX = (depth: number) => 22 + projectDepth(depth) * 66;
  const routeY = (depth: number) => 86 - projectDepth(depth) * 64;
  const signalX = routeX(progress);
  const signalY = routeY(progress);
  const portalX = routeX(portalDepth);
  const portalY = routeY(portalDepth);
  const routePath = 'M 220 447 L 880 114';
  const foregroundPath = `M 220 447 L ${portalX * 10} ${portalY * 5.2}`;
  const selectedDepth = selectedFlow === null ? 0 : selectedFlow / denominator;
  const selectedX = routeX(selectedDepth);
  const selectedY = routeY(selectedDepth);
  const selectedStep = selectedFlow === null ? null : steps[selectedFlow];
  const selectedDescription = selectedFlow === null ? null : details[selectedFlow];

  const selectFlow = (index: number) => {
    onSelect(index);
    setSelectedFlow((current) => current === index ? null : index);
  };

  return (
    <section className={styles.perspectiveFlow} aria-label={label} onKeyDown={(event) => {
      if (event.key === 'Escape') setSelectedFlow(null);
    }}>
      <header className={styles.perspectiveFlowHeader}>
        <span><i />{label}</span>
        <small>{hint}</small>
      </header>

      <div
        className={styles.perspectiveFlowStage}
        onPointerDownCapture={(event) => {
          const target = event.target as Element;
          if (!target.closest('[data-flow-index]') || target.closest(`.${styles.perspectiveFlowFlyout}`)) return;

          // Perspective makes the rear cubes overlap visually. Resolve the
          // intended cube by the pointer's nearest on-screen centre instead of
          // trusting whichever overlapping DOM box happened to win hit-testing.
          const nodes = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-flow-index]'));
          const nearest = nodes.reduce<{ node: HTMLButtonElement; distance: number } | null>((best, node) => {
            const rect = node.getBoundingClientRect();
            const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
            return !best || distance < best.distance ? { node, distance } : best;
          }, null);
          if (!nearest) return;

          const index = Number(nearest.node.dataset.flowIndex);
          if (!Number.isInteger(index)) return;
          event.preventDefault();
          event.stopPropagation();
          nearest.node.focus({ preventScroll: true });
          selectFlow(index);
        }}
      >
        <svg className={`${styles.perspectiveFlowRail} ${styles.perspectiveFlowRailBehind}`} viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <path d={routePath} />
          <path className={styles.perspectiveFlowDataStream} d={routePath} pathLength="1" />
          <path
            className={styles.perspectiveFlowRailActive}
            d={routePath}
            pathLength="1"
            style={{ '--flow-progress': progress } as CSSProperties}
          />
        </svg>

        <div className={styles.perspectiveFlowGlass} aria-hidden="true"><i /><i /></div>

        <svg className={`${styles.perspectiveFlowRail} ${styles.perspectiveFlowRailFront}`} viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
          <path d={foregroundPath} />
          <path className={styles.perspectiveFlowDataStream} d={foregroundPath} pathLength="1" />
        </svg>

        <div
          className={styles.perspectiveFlowPortal}
          style={{ '--portal-x': `${portalX}%`, '--portal-y': `${portalY}%` } as CSSProperties}
          aria-hidden="true"
        >
          <span /><i /><b />
        </div>

        {steps.map((step, index) => {
          const depth = index / denominator;
          const x = routeX(depth);
          const y = routeY(depth);
          const projectedDepth = projectDepth(depth);
          const scale = 1.34 - projectedDepth * .62;
          const reached = index <= active;
          const layerClass = depth < portalDepth ? styles.perspectiveFlowFront : styles.perspectiveFlowBehind;

          return (
            <button
              key={step}
              type="button"
              className={`${styles.perspectiveFlowNode} ${layerClass} ${reached ? styles.perspectiveFlowReached : ''} ${selectedFlow === index ? styles.perspectiveFlowSelected : ''}`}
              style={{
                '--flow-x': `${x}%`,
                '--flow-y': `${y}%`,
                '--flow-scale': scale,
                '--flow-depth': depth,
                '--flow-projected-depth': projectedDepth,
                '--flow-index': index,
                '--flow-duration': `${3.2 + depth * 1.8}s`,
                '--flow-delay': `${index * -.23}s`,
                '--flow-sequence-delay': `${index * 1.05}s`,
                '--flow-z': 40 - index,
              } as CSSProperties}
              aria-current={active === index ? 'step' : undefined}
              aria-expanded={selectedFlow === index}
              aria-controls={`flow-detail-${index}`}
              aria-label={`${String(index + 1).padStart(2, '0')} · ${step}`}
              data-flow-index={index}
              onClick={(event) => {
                // Keyboard activation has detail 0. Pointer activation is
                // handled on pointerdown so the cube can move immediately
                // without losing the subsequent click when it leaves the row.
                if (event.detail === 0) selectFlow(index);
              }}
            >
              <span className={styles.perspectiveFlowCube} aria-hidden="true">
                <i className={styles.perspectiveFlowCubeTop} />
                <i className={styles.perspectiveFlowCubeFront}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <small>{step}</small>
                </i>
                <i className={styles.perspectiveFlowCubeSide} />
                <i className={styles.perspectiveFlowCubeCore} />
                <i className={styles.perspectiveFlowCubeTether} />
                <i className={styles.perspectiveFlowCubeShadow} />
              </span>
              <strong>{step}</strong>
            </button>
          );
        })}

        <div
          className={`${styles.perspectiveFlowSignal} ${progress < portalDepth ? styles.perspectiveFlowSignalFront : styles.perspectiveFlowSignalBehind}`}
          style={{ '--signal-x': `${signalX}%`, '--signal-y': `${signalY}%` } as CSSProperties}
          aria-hidden="true"
        >
          <span />
        </div>

        {selectedFlow !== null && selectedStep && selectedDescription && (
          <aside
            id={`flow-detail-${selectedFlow}`}
            className={styles.perspectiveFlowFlyout}
            data-side={selectedX < 55 ? 'right' : 'left'}
            style={{
              '--flow-flyout-x': `${selectedX}%`,
              '--flow-flyout-y': `${selectedY}%`,
            } as CSSProperties}
            aria-live="polite"
          >
            <span className={styles.perspectiveFlowFlyoutLink} aria-hidden="true" />
            <header>
              <small>{detailLabel}</small>
              <button type="button" onClick={() => setSelectedFlow(null)} aria-label={closeLabel}>×</button>
            </header>
            <div>
              <b>{String(selectedFlow + 1).padStart(2, '0')}</b>
              <strong>{selectedStep}</strong>
            </div>
            <p>{selectedDescription}</p>
          </aside>
        )}
      </div>
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
