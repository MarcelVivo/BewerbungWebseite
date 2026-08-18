'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import savedDock from './website-dock.json';
import styles from './experience.module.css';
import { neighboringDockingStops, scrollToDockingStation } from './dockingRoute';
import { getFlightPathDraft, subscribeFlightPathDraft, updateDockRingPosition } from './flightPathStore';
import { useDraggableCalibrationPanel } from './useDraggableCalibrationPanel';

const ANCHOR = 'website';
const { prev: PREV_STOP, next: NEXT_STOP } = neighboringDockingStops(ANCHOR);

type DockConfig = {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  rotation: number;
  tilt: number;
  objectX: number;
  objectY: number;
};

type LocalDockConfig = Omit<DockConfig, 'x' | 'y'>;

const DEFAULT_DOCK: DockConfig = savedDock;
const STORAGE_KEY = 'ms-website-dock-v2';
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function WebsiteDockingStation() {
  const stationRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [config, setConfig] = useState<LocalDockConfig>(DEFAULT_DOCK);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const calibrationPanel = useDraggableCalibrationPanel('ms-website-dock-panel-v1');
  const ringPosition = useSyncExternalStore(
    subscribeFlightPathDraft,
    () => getFlightPathDraft().dockRings[ANCHOR],
    () => getFlightPathDraft().dockRings[ANCHOR],
  );

  useEffect(() => {
    const editor = new URLSearchParams(window.location.search).get('dock-editor');
    const enabled = editor === 'website' || editor === '4';
    setEditorEnabled(enabled);
    if (!enabled) return;
    scrollToDockingStation(ANCHOR);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DockConfig>;
        setConfig((current) => ({ ...current, ...parsed }));
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          updateDockRingPosition(ANCHOR, { x: parsed.x, y: parsed.y });
        }
      }
    } catch {
      // The visual remains usable when browser persistence is blocked.
    }
  }, []);

  useEffect(() => {
    if (!editorEnabled) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, x: ringPosition.x, y: ringPosition.y }));
    } catch {
      // Keep calibration available without browser persistence.
    }
    window.dispatchEvent(new CustomEvent('dock-calibration-change'));
  }, [config, editorEnabled, ringPosition]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const stage = stationRef.current?.parentElement;
      if (!stage) return;
      const bounds = stage.getBoundingClientRect();
      updateDockRingPosition(ANCHOR, {
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
  }, []);

  const startCalibration = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!editorEnabled || event.button !== 0) return;
    event.preventDefault();
    draggingRef.current = true;
  };

  const saveToWebsite = async () => {
    setSaveState('saving');
    try {
      const response = await fetch('/api/docking-config?station=website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, x: ringPosition.x, y: ringPosition.y }),
      });
      if (!response.ok) throw new Error('Unable to persist docking configuration.');
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 2200);
    } catch {
      setSaveState('error');
    }
  };

  return (
    <>
      <div
        ref={stationRef}
        className={styles.websiteDockingStation}
        style={{
          '--dock-x': `${ringPosition.x}%`,
          '--dock-y': `${ringPosition.y}%`,
          width: `${config.width}%`,
          '--dock-rotation': `${config.rotation}deg`,
          '--dock-tilt': `${config.tilt}deg`,
        } as CSSProperties}
        data-docking-anchor="website"
        data-dock-number="04"
        data-dock-label="WEBSITE / VERKAUF"
        data-dock-scale={config.scale}
        data-dock-object-x={config.objectX}
        data-dock-object-y={config.objectY}
        data-editor={editorEnabled ? 'true' : 'false'}
        onPointerDown={startCalibration}
        aria-hidden="true"
      >
        <div className={styles.problemDockPlane}>
          <i className={styles.problemDockRingOuter} />
          <i className={styles.problemDockRingMiddle} />
          <i className={styles.problemDockRingInner} />
          <b className={styles.problemDockCore} />
          <span className={styles.problemDockSignal} />
        </div>
        {editorEnabled && <span className={styles.problemDockCrosshair}>+</span>}
      </div>

      {editorEnabled && (
        <div className={styles.systemObjectTarget} style={{ left: `${ringPosition.x + config.objectX}%`, top: `${ringPosition.y + config.objectY}%` }} aria-hidden="true">
          <i /><span>OBJECT</span>
        </div>
      )}

      {editorEnabled && (
        <aside ref={calibrationPanel.panelRef} style={calibrationPanel.panelStyle} className={styles.systemDockCalibration} aria-label="Website-Dockingstation kalibrieren">
          <header onPointerDown={calibrationPanel.startDrag}><strong>WEBSITE DOCK</strong><span>CALIBRATION · DRAG</span></header>
          <label>X <input type="range" min="8" max="92" step=".05" value={ringPosition.x} onChange={(event) => updateDockRingPosition(ANCHOR, { x: Number(event.target.value) })} /><output>{ringPosition.x.toFixed(2)}</output></label>
          <label>Y <input type="range" min="8" max="92" step=".05" value={ringPosition.y} onChange={(event) => updateDockRingPosition(ANCHOR, { y: Number(event.target.value) })} /><output>{ringPosition.y.toFixed(2)}</output></label>
          <label>SIZE <input type="range" min="8" max="36" step=".1" value={config.width} onChange={(event) => setConfig((current) => ({ ...current, width: Number(event.target.value) }))} /><output>{config.width.toFixed(1)}</output></label>
          <label>R <input type="range" min="-32" max="32" step=".1" value={config.rotation} onChange={(event) => setConfig((current) => ({ ...current, rotation: Number(event.target.value) }))} /><output>{config.rotation.toFixed(1)}</output></label>
          <label>TILT <input type="range" min="0" max="78" step=".5" value={config.tilt} onChange={(event) => setConfig((current) => ({ ...current, tilt: Number(event.target.value) }))} /><output>{config.tilt.toFixed(1)}°</output></label>
          <label>OX <input type="range" min="-20" max="20" step=".1" value={config.objectX} onChange={(event) => setConfig((current) => ({ ...current, objectX: Number(event.target.value) }))} /><output>{config.objectX.toFixed(1)}</output></label>
          <label>OY <input type="range" min="-20" max="20" step=".1" value={config.objectY} onChange={(event) => setConfig((current) => ({ ...current, objectY: Number(event.target.value) }))} /><output>{config.objectY.toFixed(1)}</output></label>
          <label>S <input type="range" min=".3" max="1.2" step=".01" value={config.scale} onChange={(event) => setConfig((current) => ({ ...current, scale: Number(event.target.value) }))} /><output>{config.scale.toFixed(2)}</output></label>
          <footer>
            <button type="button" onClick={() => { setConfig(DEFAULT_DOCK); updateDockRingPosition(ANCHOR, { x: DEFAULT_DOCK.x, y: DEFAULT_DOCK.y }); }}>RESET</button>
            <button type="button" className={styles.problemDockSave} onClick={saveToWebsite} disabled={saveState === 'saving'}>
              {saveState === 'saving' ? 'SPEICHERT…' : saveState === 'saved' ? 'GESPEICHERT ✓' : saveState === 'error' ? 'FEHLER' : 'IN WEBSITE SPEICHERN'}
            </button>
          </footer>
          <footer>
            {PREV_STOP && <button type="button" onClick={() => { window.location.href = `?dock-editor=${PREV_STOP.anchor}`; }}>← {PREV_STOP.label}</button>}
            {NEXT_STOP && <button type="button" onClick={() => { window.location.href = `?dock-editor=${NEXT_STOP.anchor}`; }}>{NEXT_STOP.label} →</button>}
          </footer>
        </aside>
      )}
    </>
  );
}
