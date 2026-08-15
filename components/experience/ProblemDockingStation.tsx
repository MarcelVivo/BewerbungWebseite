'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import savedDock from './problem-dock.json';
import styles from './experience.module.css';
import { useDraggableCalibrationPanel } from './useDraggableCalibrationPanel';

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

const DEFAULT_DOCK: DockConfig = savedDock;
const STORAGE_KEY = 'ms-problem-dock-v1';
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ProblemDockingStation() {
  const stationRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [config, setConfig] = useState<DockConfig>(DEFAULT_DOCK);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const calibrationPanel = useDraggableCalibrationPanel('ms-problem-dock-panel-v1');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editor = params.get('dock-editor');
    const enabled = editor === 'problem' || editor === '2';
    setEditorEnabled(enabled);

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setConfig({ ...DEFAULT_DOCK, ...JSON.parse(stored) });
    } catch {
      // A blocked localStorage must never prevent the experience from rendering.
    }
  }, []);

  useEffect(() => {
    if (!editorEnabled) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Keep calibration usable even when persistence is unavailable.
    }
    window.dispatchEvent(new CustomEvent('dock-calibration-change'));
  }, [config, editorEnabled]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const stage = stationRef.current?.parentElement;
      if (!stage) return;
      const bounds = stage.getBoundingClientRect();
      setConfig((current) => ({
        ...current,
        x: clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1) * 100, 8, 92),
        y: clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1) * 100, 10, 90),
      }));
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
      const response = await fetch('/api/docking-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
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
        className={styles.problemDockingStation}
        style={{
          left: `${config.x}%`,
          top: `${config.y}%`,
          width: `${config.width}%`,
          '--dock-rotation': `${config.rotation}deg`,
          '--dock-tilt': `${config.tilt}deg`,
        } as CSSProperties}
        data-docking-anchor="problem"
        data-dock-number="02"
        data-dock-label="PROBLEM / FRAGMENTIERUNG"
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
        <div
          className={styles.problemObjectTarget}
          style={{ left: `${config.x + config.objectX}%`, top: `${config.y + config.objectY}%` }}
          aria-hidden="true"
        >
          <i />
          <span>OBJECT</span>
        </div>
      )}

      {editorEnabled && (
        <aside ref={calibrationPanel.panelRef} style={calibrationPanel.panelStyle} className={styles.problemDockCalibration} aria-label="Problem-Dockingstation kalibrieren">
          <header onPointerDown={calibrationPanel.startDrag}><strong>PROBLEM DOCK</strong><span>CALIBRATION · DRAG</span></header>
          <label>X <input type="range" min="8" max="92" step=".05" value={config.x} onChange={(event) => setConfig((current) => ({ ...current, x: Number(event.target.value) }))} /><output>{config.x.toFixed(2)}</output></label>
          <label>Y <input type="range" min="10" max="90" step=".05" value={config.y} onChange={(event) => setConfig((current) => ({ ...current, y: Number(event.target.value) }))} /><output>{config.y.toFixed(2)}</output></label>
          <label>SIZE <input type="range" min="8" max="36" step=".1" value={config.width} onChange={(event) => setConfig((current) => ({ ...current, width: Number(event.target.value) }))} /><output>{config.width.toFixed(1)}</output></label>
          <label>R <input type="range" min="-15" max="15" step=".1" value={config.rotation} onChange={(event) => setConfig((current) => ({ ...current, rotation: Number(event.target.value) }))} /><output>{config.rotation.toFixed(1)}</output></label>
          <label>TILT <input type="range" min="0" max="78" step=".5" value={config.tilt} onChange={(event) => setConfig((current) => ({ ...current, tilt: Number(event.target.value) }))} /><output>{config.tilt.toFixed(1)}°</output></label>
          <label>OX <input type="range" min="-20" max="20" step=".1" value={config.objectX} onChange={(event) => setConfig((current) => ({ ...current, objectX: Number(event.target.value) }))} /><output>{config.objectX.toFixed(1)}</output></label>
          <label>OY <input type="range" min="-20" max="20" step=".1" value={config.objectY} onChange={(event) => setConfig((current) => ({ ...current, objectY: Number(event.target.value) }))} /><output>{config.objectY.toFixed(1)}</output></label>
          <label>S <input type="range" min=".3" max="1.2" step=".01" value={config.scale} onChange={(event) => setConfig((current) => ({ ...current, scale: Number(event.target.value) }))} /><output>{config.scale.toFixed(2)}</output></label>
          <footer>
            <button type="button" onClick={() => setConfig(DEFAULT_DOCK)}>RESET</button>
            <button type="button" className={styles.problemDockSave} onClick={saveToWebsite} disabled={saveState === 'saving'}>
              {saveState === 'saving' ? 'SPEICHERT…' : saveState === 'saved' ? 'GESPEICHERT ✓' : saveState === 'error' ? 'FEHLER' : 'IN WEBSITE SPEICHERN'}
            </button>
          </footer>
        </aside>
      )}
    </>
  );
}
