'use client';

/**
 * Full flight-path editor - Schritt 2: dragging.
 *
 * Every anchor (start, docks - the last doubling as the terminus - and
 * intermediate control points) and every Bezier handle is directly
 * draggable. Selection, handle modes (mirrored/aligned/free/corner),
 * Alt-decouple, Shift-angle-snap, one undo step per completed drag, and
 * atomic dock-anchor+ring coupling. No panel, no reset/save UI yet - that is
 * Schritt 3.
 *
 * Architecture invariants (must not be reintroduced/violated):
 * - flightPathStore.ts is the only source of truth for points, the start
 *   anchor, and docking-ring positions. Every drag handler here calls a
 *   store setter directly - there is no local component copy of any point.
 * - The object and this rail read the exact same FlightPathModel instance
 *   (resolved.masterPath), published by ScrollEntity only.
 * - All coordinate conversions go through flightPathTransforms.ts.
 * - No FLIGHT_PATH_CHANGE_EVENT or other second state channel.
 */

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import {
  beginFlightPathHistoryEntry,
  cancelFlightPathHistoryEntry,
  commitFlightPathHistoryEntry,
  getFlightPathDraft,
  getResolvedFlightPath,
  getFlightPathRuntime,
  redoFlightPath,
  subscribeFlightPathDraft,
  subscribeResolvedFlightPath,
  subscribeFlightPathRuntime,
  undoFlightPath,
  updateDockRingPosition,
  updateFlightPathPoint,
  updateFlightPathStart,
} from './flightPathStore';
import { documentPointerToPathPoint, pathSampleToDocument, type Viewport } from './flightPathTransforms';
import { resolveBezierHandles } from './masterFlightPath';
import type { FlightPathCurveHandle, FlightPathHandleMode, FlightPathPoint } from './flightPathTypes';
import styles from './experience.module.css';

type AnchorKind = 'start' | 'dock' | 'control';

/** Identifies which store setter an anchor's drag should call - never a local copy. */
type AnchorTarget = { kind: 'start' } | { kind: 'point'; index: number };

type AnchorView = {
  key: string;
  pathRouteIndex: number;
  kind: AnchorKind;
  target: AnchorTarget;
  point: FlightPathPoint;
  documentX: number;
  documentY: number;
  scroll: number;
  curveIn: FlightPathCurveHandle;
  curveOut: FlightPathCurveHandle;
  curveInDoc: { documentX: number; documentY: number } | null;
  curveOutDoc: { documentX: number; documentY: number } | null;
};

type AnchorDrag = { type: 'anchor'; pointerId: number; target: AnchorTarget; startX: number; startY: number; scroll: number };
type HandleDrag = {
  type: 'handle';
  pointerId: number;
  target: AnchorTarget;
  kind: 'curveIn' | 'curveOut';
  startVector: FlightPathCurveHandle;
  oppositeVector: FlightPathCurveHandle;
  oppositeLength: number;
  handleMode: FlightPathHandleMode;
  /** Captured once at drag start - a raw draft FlightPathPoint has no .scroll (only resolved points do),
   *  and scroll doesn't change while dragging x/y/handles anyway. */
  scroll: number;
};
type ActiveDrag = AnchorDrag | HandleDrag;

function useEditorEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEnabled(params.get('flight-editor') === '1' || params.get('flightDebug') === '1');
  }, []);
  return enabled;
}

const anchorKindOf = (point: FlightPathPoint): AnchorKind => (point.dockAnchor ? 'dock' : 'control');

const nodeClassFor = (kind: AnchorKind, isFirst: boolean, selected: boolean) => {
  const base = kind === 'dock'
    ? `${styles.flightPathNode} ${styles.flightPathDockNode} ${styles.flightPathNodeGold}`
    : isFirst
      ? `${styles.flightPathNode} ${styles.flightPathNodeStart}`
      : `${styles.flightPathNode} ${styles.flightPathNodeIntermediate}`;
  return selected ? `${base} ${styles.flightPathNodeSelected}` : base;
};

const targetKey = (target: AnchorTarget) => (target.kind === 'start' ? 'start' : `point-${target.index}`);

const getAnchorPoint = (target: AnchorTarget): FlightPathPoint => {
  const draft = getFlightPathDraft();
  return target.kind === 'start' ? draft.start : draft.points[target.index];
};

const updateAnchor = (target: AnchorTarget, patch: Partial<FlightPathPoint>) => {
  if (target.kind === 'start') updateFlightPathStart(patch);
  else updateFlightPathPoint(target.index, patch);
};

/** Shift: snap a delta's angle to the nearest 45°, keeping its magnitude. */
const snapAngle = (x: number, y: number) => {
  const length = Math.hypot(x, y);
  if (length < 0.0001) return { x, y };
  const angle = Math.round(Math.atan2(y, x) / (Math.PI / 4)) * (Math.PI / 4);
  return { x: Math.cos(angle) * length, y: Math.sin(angle) * length };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A handle this short has no direction to show or grab - it renders exactly on top of its own
 *  anchor (e.g. the start point's auto-tangent is zero when its neighbor shares its x/y), which
 *  would otherwise block clicks on the anchor underneath. Real Bezier editors don't show a
 *  draggable handle for a true cusp either; below this length we simply don't render one. */
const HANDLE_MIN_LENGTH = 0.05;

export default function FlightPathEditor() {
  const enabled = useEditorEnabled();
  const [documentHeight, setDocumentHeight] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const dragRef = useRef<ActiveDrag | null>(null);

  const draft = useSyncExternalStore(subscribeFlightPathDraft, getFlightPathDraft, getFlightPathDraft);
  const resolved = useSyncExternalStore(subscribeResolvedFlightPath, getResolvedFlightPath, () => null);
  const runtime = useSyncExternalStore(subscribeFlightPathRuntime, getFlightPathRuntime, () => null);

  useEffect(() => {
    if (!enabled) return;
    const updateHeight = () => setDocumentHeight(document.documentElement.scrollHeight);
    updateHeight();
    window.addEventListener('resize', updateHeight);
    // Test-only introspection hook so the store's real state can be verified
    // directly (not inferred from rendered pixel positions). Only ever
    // attached in editor mode.
    (window as unknown as { __flightPathDebug?: unknown }).__flightPathDebug = {
      getDraft: getFlightPathDraft,
      getResolved: getResolvedFlightPath,
      getRuntime: getFlightPathRuntime,
    };
    return () => window.removeEventListener('resize', updateHeight);
  }, [enabled]);

  // Undo/redo keyboard shortcuts. Escape cancels an in-progress drag instead
  // of committing it (restores the pre-drag snapshot).
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redoFlightPath(); else undoFlightPath();
        return;
      }
      if (event.key === 'Escape' && dragRef.current) {
        cancelFlightPathHistoryEntry();
        dragRef.current = null;
        delete document.documentElement.dataset.flightDragging;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  // One shared pointermove/pointerup pair for both anchor and handle drags -
  // pointer capture (set on pointerdown, on the dragged element itself) keeps
  // delivering events here even when the cursor leaves that element or the
  // viewport, so the drag never silently breaks.
  useEffect(() => {
    if (!enabled) return;
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      event.preventDefault();
      const currentResolved = getResolvedFlightPath();
      if (!currentResolved) return;
      const viewport: Viewport = { width: currentResolved.viewportWidth, height: currentResolved.viewportHeight };

      if (drag.type === 'anchor') {
        const next = documentPointerToPathPoint(event.pageX, event.pageY, drag.scroll, viewport);
        let deltaX = next.x - drag.startX;
        let deltaY = next.y - drag.startY;
        if (event.shiftKey) {
          const snapped = snapAngle(deltaX, deltaY);
          deltaX = snapped.x;
          deltaY = snapped.y;
        }
        const x = clamp(drag.startX + deltaX, 2, 98);
        const y = clamp(drag.startY + deltaY, 2, 98);
        updateAnchor(drag.target, { x, y });

        const dockAnchor = getAnchorPoint(drag.target).dockAnchor;
        if (dockAnchor) {
          const stage = document.querySelector<HTMLElement>(`[data-docking-anchor="${dockAnchor}"]`)?.parentElement;
          if (stage) {
            const stageRect = stage.getBoundingClientRect();
            const stageX = clamp((event.clientX - stageRect.left) / Math.max(stageRect.width, 1) * 100, 2, 98);
            const stageY = clamp((event.clientY - stageRect.top) / Math.max(stageRect.height, 1) * 100, 2, 98);
            updateDockRingPosition(dockAnchor, { x: stageX, y: stageY });
          }
        }
        return;
      }

      // Handle drag: compute the dragged handle's new delta relative to its
      // own anchor, then couple the opposite handle per handleMode.
      const anchorPoint = getAnchorPoint(drag.target);
      const pointerLocal = documentPointerToPathPoint(event.pageX, event.pageY, drag.scroll, viewport);
      let dx = pointerLocal.x - anchorPoint.x;
      let dy = pointerLocal.y - anchorPoint.y;
      if (event.shiftKey) {
        const snapped = snapAngle(dx, dy);
        dx = snapped.x;
        dy = snapped.y;
      }
      const dragged: FlightPathCurveHandle = { x: dx, y: dy, z: drag.startVector.z };
      const oppositeKind: 'curveIn' | 'curveOut' = drag.kind === 'curveIn' ? 'curveOut' : 'curveIn';
      const temporarilyFree = event.altKey && (drag.handleMode === 'mirrored' || drag.handleMode === 'aligned');

      let opposite = drag.oppositeVector;
      if (!temporarilyFree) {
        if (drag.handleMode === 'mirrored') {
          opposite = { x: -dragged.x, y: -dragged.y, z: -dragged.z };
        } else if (drag.handleMode === 'aligned') {
          const length = Math.hypot(dragged.x, dragged.y, dragged.z);
          if (length > 0.0001 && drag.oppositeLength > 0.0001) {
            opposite = {
              x: -dragged.x / length * drag.oppositeLength,
              y: -dragged.y / length * drag.oppositeLength,
              z: -dragged.z / length * drag.oppositeLength,
            };
          }
        }
      }

      updateAnchor(drag.target, { [drag.kind]: dragged, [oppositeKind]: opposite } as Partial<FlightPathPoint>);
    };

    const finish = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      delete document.documentElement.dataset.flightDragging;
      commitFlightPathHistoryEntry();
    };

    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [enabled]);

  if (!enabled || !resolved) return null;

  const viewport: Viewport = { width: resolved.viewportWidth, height: resolved.viewportHeight };
  const pathRoute = resolved.pathRoute;

  const anchors: AnchorView[] = pathRoute.map((point, pathRouteIndex) => {
    const handles = resolveBezierHandles(pathRoute, pathRouteIndex);
    const isLast = pathRouteIndex === pathRoute.length - 1;
    const target: AnchorTarget = pathRouteIndex === 0 ? { kind: 'start' } : { kind: 'point', index: pathRouteIndex - 1 };
    return {
      key: `${point.dockAnchor ?? point.type ?? 'control'}-${pathRouteIndex}`,
      pathRouteIndex,
      kind: pathRouteIndex === 0 ? 'start' : anchorKindOf(point),
      target,
      point,
      // Already resolved by ScrollEntity's resolveRoute() - the same document
      // position the object itself is placed at, not recomputed here.
      documentX: point.documentX,
      documentY: point.documentY,
      scroll: point.scroll,
      curveIn: handles.curveIn,
      curveOut: handles.curveOut,
      curveInDoc: pathRouteIndex > 0 && Math.hypot(handles.curveIn.x, handles.curveIn.y) > HANDLE_MIN_LENGTH
        ? pathSampleToDocument({ x: point.x + handles.curveIn.x, y: point.y + handles.curveIn.y }, point.scroll, viewport)
        : null,
      curveOutDoc: !isLast && Math.hypot(handles.curveOut.x, handles.curveOut.y) > HANDLE_MIN_LENGTH
        ? pathSampleToDocument({ x: point.x + handles.curveOut.x, y: point.y + handles.curveOut.y }, point.scroll, viewport)
        : null,
    };
  });

  const startAnchorDrag = (event: ReactPointerEvent<HTMLButtonElement>, anchor: AnchorView) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedKey(anchor.key);
    beginFlightPathHistoryEntry();
    dragRef.current = { type: 'anchor', pointerId: event.pointerId, target: anchor.target, startX: anchor.point.x, startY: anchor.point.y, scroll: anchor.scroll };
    document.documentElement.dataset.flightDragging = 'true';
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic test events do not own pointer capture. */ }
  };

  const startHandleDrag = (event: ReactPointerEvent<HTMLButtonElement>, anchor: AnchorView, kind: 'curveIn' | 'curveOut') => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedKey(anchor.key);
    beginFlightPathHistoryEntry();
    const startVector = kind === 'curveIn' ? anchor.curveIn : anchor.curveOut;
    const oppositeVector = kind === 'curveIn' ? anchor.curveOut : anchor.curveIn;
    dragRef.current = {
      type: 'handle',
      pointerId: event.pointerId,
      target: anchor.target,
      kind,
      startVector,
      oppositeVector,
      oppositeLength: Math.hypot(oppositeVector.x, oppositeVector.y, oppositeVector.z),
      handleMode: anchor.point.handleMode ?? 'aligned',
      scroll: anchor.scroll,
    };
    document.documentElement.dataset.flightDragging = 'true';
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic test events do not own pointer capture. */ }
  };

  let hauptankerNumber = 0;

  const distancePxLabel = runtime ? runtime.distancePx.toFixed(3) : '–';
  const distanceOk = runtime ? runtime.distancePx < 1 : true;
  const selectedAnchor = anchors.find((anchor) => anchor.key === selectedKey) ?? null;

  return (
    <div className={styles.flightPathEditor} data-flight-path-editor-root style={{ height: documentHeight || undefined }}>
      <div className={styles.flightPathRailLayer} style={{ height: documentHeight || undefined }}>
        <svg
          className={styles.flightPathRail}
          width="100%"
          height={documentHeight || 1}
          aria-label="Vollständige Flugbahn: Start bis zur letzten Docking-Station (zugleich Ziel) - aus der realen Scrollzuordnung abgetastet"
        >
          <path className={styles.flightPathRailShadow} d={resolved.railPath} />
          <path className={styles.flightPathRailLine} data-flight-path-rail-line d={resolved.railPath} />
        </svg>
      </div>

      <div className={styles.flightBezierOverlay} aria-hidden="true">
        <svg>
          {anchors.map((anchor) => (
            <g key={`lines-${anchor.key}`}>
              {anchor.curveInDoc && <line x1={anchor.documentX} y1={anchor.documentY} x2={anchor.curveInDoc.documentX} y2={anchor.curveInDoc.documentY} />}
              {anchor.curveOutDoc && <line x1={anchor.documentX} y1={anchor.documentY} x2={anchor.curveOutDoc.documentX} y2={anchor.curveOutDoc.documentY} />}
            </g>
          ))}
        </svg>
      </div>

      <div className={styles.flightPathNodeLayer}>
        {anchors.map((anchor) => (
          <div key={`handles-${anchor.key}`}>
            {anchor.curveInDoc && (
              <button
                type="button"
                className={styles.flightBezierHandle}
                style={{ left: anchor.curveInDoc.documentX, top: anchor.curveInDoc.documentY }}
                onPointerDown={(event) => startHandleDrag(event, anchor, 'curveIn')}
                aria-label="Eingehenden Bézier-Griff ziehen"
                data-anchor-key={anchor.key}
                data-handle-kind="curveIn"
              >
                <i />
              </button>
            )}
            {anchor.curveOutDoc && (
              <button
                type="button"
                className={`${styles.flightBezierHandle} ${styles.flightBezierHandleOut}`}
                style={{ left: anchor.curveOutDoc.documentX, top: anchor.curveOutDoc.documentY }}
                onPointerDown={(event) => startHandleDrag(event, anchor, 'curveOut')}
                aria-label="Ausgehenden Bézier-Griff ziehen"
                data-anchor-key={anchor.key}
                data-handle-kind="curveOut"
              >
                <i />
              </button>
            )}
          </div>
        ))}

        {anchors.map((anchor) => {
          const isMain = anchor.kind !== 'control';
          if (isMain) hauptankerNumber += 1;
          const isTerminal = Boolean(anchor.point.isTerminal);
          const progress = resolved.masterPath.getNodeProgress(anchor.pathRouteIndex);
          const baseLabel = anchor.kind === 'start' ? 'START' : anchor.point.dockLabel ?? `DOCK ${anchor.point.dockNumber ?? ''}`;
          const label = isTerminal ? `${baseLabel} · ZIEL` : baseLabel;
          const isSelected = anchor.key === selectedKey;

          return (
            <button
              type="button"
              key={`node-${anchor.key}`}
              className={nodeClassFor(anchor.kind, anchor.kind === 'start', isSelected)}
              style={{ left: anchor.documentX, top: anchor.documentY, '--node-depth': 1 } as CSSProperties}
              onPointerDown={(event) => startAnchorDrag(event, anchor)}
              onClick={() => setSelectedKey(anchor.key)}
              aria-label={anchor.kind === 'start' ? 'Startpunkt verschieben' : anchor.kind === 'dock' ? `Docking-Anker ${anchor.point.dockLabel} verschieben` : 'Zwischenanker verschieben'}
              data-anchor-key={anchor.key}
            >
              <span className={styles.flightPathNodeDepth} />
              {isTerminal && <i className={styles.flightPathTerminalRing} />}
              <span className={styles.flightPathNodeCore}>{anchor.kind === 'dock' ? '◇' : anchor.kind === 'control' ? '●' : '★'}</span>
              {isMain && (
                <span className={styles.flightPathNodeLabel}>
                  {label}
                  <small>
                    {String(hauptankerNumber).padStart(2, '0')} · {anchor.point.id}
                    {'\n'}PROGRESS {progress.toFixed(4)} · SCROLL {Math.round(anchor.scroll)}
                  </small>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.flightPathDebugPanel} data-flight-path-debug>
        {runtime ? (
          <>
            <strong>FLIGHT PATH DEBUG</strong>{'\n'}
            scrollY        {Math.round(runtime.scrollY)}{'\n'}
            path progress  {runtime.currentPathProgress.toFixed(5)}{'\n'}
            segment        {runtime.segmentIndex}{'\n'}
            section        {runtime.activeSectionId}{'\n'}
            station        {runtime.station || '–'}{'\n'}
            phase          {runtime.phaseLabel}{'\n'}
            <span style={{ color: distanceOk ? '#6ee7b7' : '#ff8080' }}>distancePx     {distancePxLabel}</span>{'\n'}
            points         {draft.points.length} (+ start) · terminal=last dock{'\n'}
            selected       {selectedAnchor ? `${selectedAnchor.kind.toUpperCase()} · ${selectedAnchor.point.handleMode ?? 'aligned'}` : '–'}
          </>
        ) : 'wird initialisiert…'}
      </div>
    </div>
  );
}
