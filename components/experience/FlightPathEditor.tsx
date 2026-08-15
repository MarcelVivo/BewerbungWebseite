'use client';

/**
 * PROOF OF CONCEPT - shared-architecture test only.
 *
 * This intentionally does NOT implement the full Illustrator-style editor
 * (no dual Bezier handles, no multi-point editing, no big settings panel,
 * no JSON save). It exists to prove one thing: ScrollEntity (the real
 * object) and this overlay read and write the exact same FlightPathStore
 * and the exact same FlightPathModel instance, through the exact same
 * coordinate transforms - so the drawn rail and the live object can never
 * drift apart again.
 *
 * Only one control point (the one between the hero section and the first
 * docking station) is draggable, live-state + optional localStorage only.
 */

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import {
  getFlightPathDraft,
  getResolvedFlightPath,
  getFlightPathRuntime,
  setFlightPathDraft,
  subscribeFlightPathDraft,
  subscribeResolvedFlightPath,
  subscribeFlightPathRuntime,
  updateFlightPathPoint,
} from './flightPathStore';
import { documentPointerToPathPoint, pathSampleToDocument, type Viewport } from './flightPathTransforms';
import styles from './experience.module.css';

const POC_STORAGE_KEY = 'ms-flight-path-poc-draft-v1';
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function FlightPathEditor() {
  const [enabled, setEnabled] = useState(false);
  const [documentHeight, setDocumentHeight] = useState(0);
  const originalPointRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef<{ pointerId: number } | null>(null);

  const draft = useSyncExternalStore(subscribeFlightPathDraft, getFlightPathDraft, getFlightPathDraft);
  const resolved = useSyncExternalStore(subscribeResolvedFlightPath, getResolvedFlightPath, () => null);
  const runtime = useSyncExternalStore(subscribeFlightPathRuntime, getFlightPathRuntime, () => null);

  const firstDockIndex = draft.points.findIndex((point) => point.dockAnchor);
  const editableIndex = firstDockIndex > 0 ? firstDockIndex - 1 : 0;

  useEffect(() => {
    const active = new URLSearchParams(window.location.search).get('flight-editor') === '1';
    setEnabled(active);
    if (!active) return;

    // Test-only introspection hook so the store's real state can be verified
    // directly (not inferred from rendered pixel positions). Only ever
    // attached in editor mode.
    (window as unknown as { __flightPathDebug?: unknown }).__flightPathDebug = {
      getDraft: getFlightPathDraft,
      getResolved: getResolvedFlightPath,
      getRuntime: getFlightPathRuntime,
    };

    if (!originalPointRef.current) {
      const point = getFlightPathDraft().points[editableIndex];
      if (point) originalPointRef.current = { x: point.x, y: point.y };
    }

    try {
      const saved = window.localStorage.getItem(POC_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { index: number; x: number; y: number };
        if (parsed.index === editableIndex) updateFlightPathPoint(editableIndex, { x: parsed.x, y: parsed.y });
      }
    } catch {
      // Live state still works without persistence.
    }

    const updateHeight = () => setDocumentHeight(document.documentElement.scrollHeight);
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
    // editableIndex is derived from the draft, which is stable for this PoC's fixed point count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const point = draft.points[editableIndex];
    if (!point) return;
    try {
      window.localStorage.setItem(POC_STORAGE_KEY, JSON.stringify({ index: editableIndex, x: point.x, y: point.y }));
    } catch {
      // Live state still works without persistence.
    }
  }, [draft, editableIndex, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const move = (event: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const currentResolved = getResolvedFlightPath();
      const anchorScroll = currentResolved?.route[editableIndex]?.scroll ?? 0;
      const viewport: Viewport = { width: window.innerWidth, height: window.innerHeight };
      const next = documentPointerToPathPoint(event.pageX, event.pageY, anchorScroll, viewport);
      updateFlightPathPoint(editableIndex, { x: clamp(next.x, 2, 98), y: clamp(next.y, 2, 98) });
    };
    const finish = (event: PointerEvent) => {
      if (draggingRef.current?.pointerId === event.pointerId) draggingRef.current = null;
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [enabled, editableIndex]);

  if (!enabled) return null;

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    draggingRef.current = { pointerId: event.pointerId };
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* Synthetic test events do not own pointer capture. */ }
  };

  const resetPoint = () => {
    const original = originalPointRef.current;
    if (!original) return;
    updateFlightPathPoint(editableIndex, { x: original.x, y: original.y });
  };

  const anchorPoint = resolved?.route[editableIndex];
  const viewportSize: Viewport = resolved
    ? { width: resolved.viewportWidth, height: resolved.viewportHeight }
    : { width: 1, height: 1 };
  const objectDocument = runtime ? pathSampleToDocument(runtime, runtime.scrollY, viewportSize) : null;

  return (
    <div className={styles.flightPathEditor} style={{ height: documentHeight || undefined }} data-flight-path-editor-poc>
      <div className={styles.flightPathRailLayer} style={{ height: documentHeight || undefined }}>
        <svg className={styles.flightPathRail} width="100%" height={documentHeight || 1} aria-label="Flugbahn, aus der echten Scrollposition abgetastet - dieselbe Instanz wie das Objekt">
          <path className={styles.flightPathRailShadow} d={resolved?.railPath ?? ''} />
          <path className={styles.flightPathRailLine} d={resolved?.railPath ?? ''} />
        </svg>
      </div>

      <div className={styles.flightPathNodeLayer}>
        {anchorPoint && (
          <button
            type="button"
            className={styles.flightPathNode}
            style={{ left: anchorPoint.documentX, top: anchorPoint.documentY, '--node-depth': 1 } as CSSProperties}
            onPointerDown={startDrag}
            aria-label="Einzigen Testpunkt zwischen Hero und erster Docking-Station verschieben"
          >
            <span className={styles.flightPathNodeDepth} />
            <span className={styles.flightPathNodeCore}>●</span>
            <span className={styles.flightPathNodeLabel}>
              TEST-PUNKT
              <small>X {anchorPoint.x.toFixed(1)} · Y {anchorPoint.y.toFixed(1)}</small>
            </span>
          </button>
        )}

        {objectDocument && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: objectDocument.documentX,
              top: objectDocument.documentY,
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5,
              borderRadius: '50%',
              background: 'rgba(80, 220, 140, .9)',
              boxShadow: '0 0 0 2px rgba(80,220,140,.3), 0 0 12px rgba(80,220,140,.8)',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        )}
      </div>

      <output className={styles.flightPathRuntimeReadout} data-poc-readout>
        {runtime
          ? [
            `distancePx  ${runtime.distancePx.toFixed(3)}`,
            `scrollY  ${Math.round(runtime.scrollY)}`,
            `STATION ${runtime.station || '–'} · ${runtime.phase.toUpperCase()}`,
            `PATH ${runtime.currentPathProgress.toFixed(5)}`,
          ].join('\n')
          : 'wird initialisiert…'}
      </output>

      <button
        type="button"
        onClick={resetPoint}
        style={{ position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 50, padding: '.5rem .9rem', font: 'inherit', cursor: 'pointer', pointerEvents: 'auto' }}
      >
        TEST-PUNKT ZURÜCKSETZEN
      </button>
    </div>
  );
}

// Kept for a possible future full editor: writing a brand-new draft wholesale
// (not used by this PoC, which only ever patches the one test point).
export { setFlightPathDraft };
