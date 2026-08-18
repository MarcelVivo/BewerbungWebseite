'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import aboutDock from './about-dock.json';
import contactDock from './contact-dock.json';
import dataDock from './data-dock.json';
import heroDock from './hero-dock.json';
import processDock from './process-dock.json';
import projectsDock from './projects-dock.json';
import styles from './experience.module.css';
import { neighboringDockingStops, scrollToDockingStation } from './dockingRoute';
import { getFlightPathDraft, subscribeFlightPathDraft, updateDockRingPosition } from './flightPathStore';
import { useDraggableCalibrationPanel } from './useDraggableCalibrationPanel';

type DockConfig = { x: number; y: number; scale: number; width: number; height: number; rotation: number; tilt: number; objectX: number; objectY: number };
type LocalDockConfig = Omit<DockConfig, 'x' | 'y'>;
type StationId = 'hero' | 'process' | 'data' | 'projects' | 'about' | 'contact';

const stationConfig: Record<StationId, DockConfig> = {
  hero: heroDock,
  process: processDock,
  data: dataDock,
  projects: projectsDock,
  about: aboutDock,
  contact: contactDock,
};
const stationEditorNumber: Record<StationId, string> = { hero: '1', process: '6', data: '7', projects: '8', about: '9', contact: '10' };
const stationDisplay: Record<StationId, { number: string; label: string }> = {
  hero: { number: '01', label: 'START' },
  process: { number: '06', label: 'PROZESSE' },
  data: { number: '07', label: 'DATEN' },
  projects: { number: '08', label: 'PROJEKTE' },
  about: { number: '09', label: 'UEBER MICH' },
  contact: { number: '10', label: 'KONTAKT' },
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function SectionDockingStation({ station }: { station: StationId }) {
  const stationRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const defaultDock = stationConfig[station];
  const storageKey = `ms-${station}-dock-v1`;
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [config, setConfig] = useState<LocalDockConfig>(defaultDock);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const calibrationPanel = useDraggableCalibrationPanel(`ms-${station}-dock-panel-v1`);
  const { prev: prevStop, next: nextStop } = neighboringDockingStops(station);
  const ringPosition = useSyncExternalStore(
    subscribeFlightPathDraft,
    () => getFlightPathDraft().dockRings[station],
    () => getFlightPathDraft().dockRings[station],
  );

  useEffect(() => {
    const editor = new URLSearchParams(window.location.search).get('dock-editor');
    const enabled = editor === station || editor === stationEditorNumber[station];
    setEditorEnabled(enabled);
    if (!enabled) return;
    scrollToDockingStation(station);
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DockConfig>;
        setConfig((current) => ({ ...current, ...parsed }));
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          updateDockRingPosition(station, { x: parsed.x, y: parsed.y });
        }
      }
    } catch { /* Keep the station available without persistence. */ }
  }, [defaultDock, station, storageKey]);

  useEffect(() => {
    if (!editorEnabled) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify({ ...config, x: ringPosition.x, y: ringPosition.y })); } catch { /* Keep calibration available. */ }
    window.dispatchEvent(new CustomEvent('dock-calibration-change'));
  }, [config, editorEnabled, storageKey, ringPosition]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const stage = stationRef.current?.parentElement;
      if (!stage) return;
      const bounds = stage.getBoundingClientRect();
      updateDockRingPosition(station, {
        x: clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1) * 100, 8, 92),
        y: clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1) * 100, 8, 92),
      });
    };
    const finishDrag = () => { draggingRef.current = false; };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, [station]);

  const startCalibration = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!editorEnabled || event.button !== 0) return;
    event.preventDefault();
    draggingRef.current = true;
  };

  const saveToWebsite = async () => {
    setSaveState('saving');
    try {
      const response = await fetch(`/api/docking-config?station=${station}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...config, x: ringPosition.x, y: ringPosition.y }) });
      if (!response.ok) throw new Error('Unable to persist docking configuration.');
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 2200);
    } catch { setSaveState('error'); }
  };

  return (
    <div className={styles.sectionDockLayer} data-editor={editorEnabled ? 'true' : 'false'}>
      <div
        ref={stationRef}
        className={styles.sectionRoundDockingStation}
        style={{
          '--dock-x': `${ringPosition.x}%`, '--dock-y': `${ringPosition.y}%`, width: `${config.width}%`, '--dock-rotation': `${config.rotation}deg`, '--dock-tilt': `${config.tilt}deg`,
          '--problem-dock-engaged': `var(--${station}-dock-engaged)`, '--problem-dock-charge': `var(--${station}-dock-charge)`,
        } as CSSProperties}
        data-docking-anchor={station}
        data-dock-number={stationDisplay[station].number}
        data-dock-label={stationDisplay[station].label}
        data-dock-scale={config.scale}
        data-dock-object-x={config.objectX}
        data-dock-object-y={config.objectY}
        data-editor={editorEnabled ? 'true' : 'false'}
        onPointerDown={startCalibration}
        aria-hidden="true"
      >
        <div className={styles.problemDockPlane}>
          <i className={styles.problemDockRingOuter} /><i className={styles.problemDockRingMiddle} /><i className={styles.problemDockRingInner} />
          <b className={styles.problemDockCore} /><span className={styles.problemDockSignal} />
        </div>
        {editorEnabled && <span className={styles.problemDockCrosshair}>+</span>}
      </div>

      {editorEnabled && <div className={styles.systemObjectTarget} style={{ left: `${ringPosition.x + config.objectX}%`, top: `${ringPosition.y + config.objectY}%` }} aria-hidden="true"><i /><span>OBJECT</span></div>}

      {editorEnabled && (
        <aside ref={calibrationPanel.panelRef} style={calibrationPanel.panelStyle} className={styles.systemDockCalibration} aria-label={`${station}-Dockingstation kalibrieren`}>
          <header onPointerDown={calibrationPanel.startDrag}><strong>{station.toUpperCase()} DOCK</strong><span>CALIBRATION · DRAG</span></header>
          <label>X <input type="range" min="8" max="92" step=".05" value={ringPosition.x} onChange={(event) => updateDockRingPosition(station, { x: Number(event.target.value) })} /><output>{ringPosition.x.toFixed(2)}</output></label>
          <label>Y <input type="range" min="8" max="92" step=".05" value={ringPosition.y} onChange={(event) => updateDockRingPosition(station, { y: Number(event.target.value) })} /><output>{ringPosition.y.toFixed(2)}</output></label>
          <label>SIZE <input type="range" min="8" max="36" step=".1" value={config.width} onChange={(event) => setConfig((current) => ({ ...current, width: Number(event.target.value) }))} /><output>{config.width.toFixed(1)}</output></label>
          <label>R <input type="range" min="-32" max="32" step=".1" value={config.rotation} onChange={(event) => setConfig((current) => ({ ...current, rotation: Number(event.target.value) }))} /><output>{config.rotation.toFixed(1)}</output></label>
          <label>TILT <input type="range" min="0" max="78" step=".5" value={config.tilt} onChange={(event) => setConfig((current) => ({ ...current, tilt: Number(event.target.value) }))} /><output>{config.tilt.toFixed(1)}°</output></label>
          <label>OX <input type="range" min="-20" max="20" step=".1" value={config.objectX} onChange={(event) => setConfig((current) => ({ ...current, objectX: Number(event.target.value) }))} /><output>{config.objectX.toFixed(1)}</output></label>
          <label>OY <input type="range" min="-20" max="20" step=".1" value={config.objectY} onChange={(event) => setConfig((current) => ({ ...current, objectY: Number(event.target.value) }))} /><output>{config.objectY.toFixed(1)}</output></label>
          <label>S <input type="range" min=".3" max="1.2" step=".01" value={config.scale} onChange={(event) => setConfig((current) => ({ ...current, scale: Number(event.target.value) }))} /><output>{config.scale.toFixed(2)}</output></label>
          <footer><button type="button" onClick={() => { setConfig(defaultDock); updateDockRingPosition(station, { x: defaultDock.x, y: defaultDock.y }); }}>RESET</button><button type="button" className={styles.problemDockSave} onClick={saveToWebsite} disabled={saveState === 'saving'}>{saveState === 'saving' ? 'SPEICHERT…' : saveState === 'saved' ? 'GESPEICHERT ✓' : saveState === 'error' ? 'FEHLER' : 'IN WEBSITE SPEICHERN'}</button></footer>
          {(prevStop || nextStop) && (
            <footer>
              {prevStop && <button type="button" onClick={() => { window.location.href = `?dock-editor=${prevStop.anchor}`; }}>← {prevStop.label}</button>}
              {nextStop && <button type="button" onClick={() => { window.location.href = `?dock-editor=${nextStop.anchor}`; }}>{nextStop.label} →</button>}
            </footer>
          )}
        </aside>
      )}
    </div>
  );
}
