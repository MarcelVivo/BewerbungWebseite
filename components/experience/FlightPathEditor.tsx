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
  discardFlightPathDraft,
  enableFlightPathDraftPersistence,
  getFlightPathDraft,
  getFlightPathHistoryState,
  getOriginalFlightPathConfig,
  getResolvedFlightPath,
  getFlightPathRuntime,
  redoFlightPath,
  resetFlightPathPoint,
  resetFlightPathRoute,
  resetFlightPathSegment,
  restoreFlightPathDraftFromStorage,
  saveFlightPathPersistently,
  subscribeFlightPathDraft,
  subscribeFlightPathHistory,
  subscribeResolvedFlightPath,
  undoFlightPath,
  updateDockRingPosition,
  updateFlightPathFollowSpeed,
  updateFlightPathPoint,
  updateFlightPathStart,
  type FlightPathAnchorTarget,
} from './flightPathStore';
import { documentPointerToPathPoint, pathSampleToDocument, type Viewport } from './flightPathTransforms';
import { resolveBezierHandles } from './masterFlightPath';
import type { FlightPathCurveHandle, FlightPathHandleMode, FlightPathPoint } from './flightPathTypes';
import { useDraggableCalibrationPanel } from './useDraggableCalibrationPanel';
import styles from './experience.module.css';

const SETTINGS_PANEL_COLLAPSED_STORAGE_KEY = 'ms-flight-path-settings-collapsed-v1';

type AnchorKind = 'start' | 'dock' | 'control';

/** Identifies which store setter an anchor's drag should call - never a local copy. Re-exported
 *  by flightPathStore.ts itself so reset actions and this file's drag/selection code share one
 *  definition. */
type AnchorTarget = FlightPathAnchorTarget;

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
  /** Structurally valid (curveIn for every point but the first, curveOut for every point but the
   *  last) but currently within ANCHOR_HANDLE_CLEARANCE_PX of the anchor on screen, so no
   *  curveInDoc/curveOutDoc to grab - a small "create handle" affordance renders instead, but only
   *  while this anchor is selected. Placed along the handle's real (if short) direction, or a
   *  fixed default when the handle has literally zero length. */
  curveInCreatable: boolean;
  curveOutCreatable: boolean;
  curveInCreateDir: { dx: number; dy: number };
  curveOutCreateDir: { dx: number; dy: number };
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

/** Where a dock anchor rests relative to its real docking station's ring,
 *  expressed as a multiple of the ring's own on-screen radius (0 = ring
 *  center, negative = above, positive = below) - independent of viewport
 *  size, so a value tuned once looks right on any screen. Reads/writes the
 *  ring's live rect directly (same DOM query the dock-tracking effect
 *  above uses) rather than going through path-space percent math, since
 *  that's the mental model this is meant to replace: "how far off the
 *  ring's center" instead of an abstract y percentage. */
const getDockRingRect = (dockAnchor: string) => document.querySelector<HTMLElement>(`[data-docking-anchor="${dockAnchor}"]`)?.getBoundingClientRect() ?? null;

const getDockOffsetRatio = (point: FlightPathPoint, axis: 'x' | 'y'): number | null => {
  if (!point.dockAnchor) return null;
  const rect = getDockRingRect(point.dockAnchor);
  if (!rect) return null;
  const viewportSize = axis === 'x' ? window.innerWidth : window.innerHeight;
  const ringCenter = axis === 'x' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
  const ringRadius = (axis === 'x' ? rect.width : rect.height) / 2;
  const entityScreenPos = ((axis === 'x' ? point.x : point.y) / 100) * viewportSize;
  return ringRadius > 0 ? (entityScreenPos - ringCenter) / ringRadius : null;
};

const applyDockOffsetRatio = (target: AnchorTarget, point: FlightPathPoint, axis: 'x' | 'y', ratio: number) => {
  if (!point.dockAnchor || !Number.isFinite(ratio)) return;
  const rect = getDockRingRect(point.dockAnchor);
  if (!rect) return;
  const viewportSize = axis === 'x' ? window.innerWidth : window.innerHeight;
  const ringCenter = axis === 'x' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
  const ringRadius = (axis === 'x' ? rect.width : rect.height) / 2;
  const targetScreenPos = ringCenter + ratio * ringRadius;
  const targetPercent = clamp((targetScreenPos / viewportSize) * 100, 2, 98);
  updateAnchor(target, axis === 'x' ? { x: targetPercent } : { y: targetPercent });
};

/** Shift: snap a delta's angle to the nearest 45°, keeping its magnitude. */
const snapAngle = (x: number, y: number) => {
  const length = Math.hypot(x, y);
  if (length < 0.0001) return { x, y };
  const angle = Math.round(Math.atan2(y, x) / (Math.PI / 4)) * (Math.PI / 4);
  return { x: Math.cos(angle) * length, y: Math.sin(angle) * length };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Anchor buttons are ~44px hit circles (~38px for dock anchors' bigger 4.2rem variant, e.g. hero's
 *  ~71px at this depth-scale); a handle whose on-screen distance from its own anchor is smaller
 *  than their combined radius renders (partly or fully) underneath the anchor button, which always
 *  wins the click since it paints later. This must be measured in actual document pixels, not
 *  path-space percent - the two axes scale differently (viewport width vs height) and a path-space
 *  threshold that hides a truly-zero handle (e.g. the start point's auto-tangent, whose neighbor
 *  shares its x/y) does NOT reliably catch a handle that is merely short on screen, like a real,
 *  non-zero, migrated handle a few percent long (found live-testing hero's dock handle, whose
 *  ~22px offset still sat inside its own dock-sized anchor's ~36px radius). Below this clearance
 *  the normal handle button doesn't render at all; a small "create" affordance (see
 *  curveInCreatable/curveOutCreatable) takes its place instead, positioned at the same clearance so
 *  it never overlaps the largest (dock) anchor variant either. */
const ANCHOR_HANDLE_CLEARANCE_PX = 55;
/** Fixed default direction for the create-affordance when the handle has literally zero length
 *  (no direction to place it along). Used for curveOut; curveIn mirrors it. */
const DEFAULT_CREATE_DIR = { dx: 1 / Math.SQRT2, dy: -1 / Math.SQRT2 };

type SaveState = { status: 'idle' | 'saving' | 'saved' | 'error'; error?: string };

/** useSyncExternalStore's getServerSnapshot must return the same reference on every call, or
 *  React logs "getServerSnapshot should be cached" and can loop - a fresh object literal here
 *  broke that contract (see flightPathStore.ts's own cachedHistoryState for the matching fix on
 *  the client-snapshot side). */
const DEFAULT_HISTORY_STATE = { canUndo: false, canRedo: false };

export default function FlightPathEditor() {
  const enabled = useEditorEnabled();
  const [documentHeight, setDocumentHeight] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  const [copyLabel, setCopyLabel] = useState('KONFIGURATION KOPIEREN');
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const dragRef = useRef<ActiveDrag | null>(null);
  const settingsPanel = useDraggableCalibrationPanel('ms-flight-path-settings-panel-v1');

  useEffect(() => {
    try {
      setSettingsCollapsed(window.localStorage.getItem(SETTINGS_PANEL_COLLAPSED_STORAGE_KEY) === '1');
    } catch {
      // Panel just stays expanded when persistence is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_PANEL_COLLAPSED_STORAGE_KEY, settingsCollapsed ? '1' : '0');
    } catch {
      // Collapse state simply won't survive a reload when persistence is unavailable.
    }
  }, [settingsCollapsed]);

  const draft = useSyncExternalStore(subscribeFlightPathDraft, getFlightPathDraft, getFlightPathDraft);
  const resolved = useSyncExternalStore(subscribeResolvedFlightPath, getResolvedFlightPath, () => null);
  const historyState = useSyncExternalStore(subscribeFlightPathHistory, getFlightPathHistoryState, () => DEFAULT_HISTORY_STATE);

  // The real docking-station ring is already draggable-together-with-its-anchor
  // (the pointermove handler below calls updateDockRingPosition alongside
  // updateAnchor whenever a dock's own point is dragged) - but only the small
  // anchor node itself is a drag target, and the ring is usually much bigger
  // than that. This tracks every ring's live on-screen rect (regardless of
  // scroll/hold state, unlike dockScreenPositions above) purely so a
  // same-size invisible hit zone can be rendered over the ring, wired to the
  // exact same startAnchorDrag handler - grabbing anywhere on the ring moves
  // both the ring and the point together, same as grabbing the small node.
  const [dockRingRects, setDockRingRects] = useState<Record<string, { x: number; y: number; width: number; height: number } | undefined>>({});
  useEffect(() => {
    if (!enabled) return;
    const dockAnchorIds = Array.from(new Set(draft.points.map((point) => point.dockAnchor).filter((id): id is string => Boolean(id))));
    if (dockAnchorIds.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setDockRingRects((previous) => {
        let changed = false;
        const next = { ...previous };
        dockAnchorIds.forEach((anchorId) => {
          const stationEl = document.querySelector<HTMLElement>(`[data-docking-anchor="${anchorId}"]`);
          if (!stationEl) {
            if (next[anchorId]) { next[anchorId] = undefined; changed = true; }
            return;
          }
          const rect = stationEl.getBoundingClientRect();
          const before = previous[anchorId];
          if (!before || Math.abs(before.x - rect.left) > .5 || Math.abs(before.y - rect.top) > .5 || Math.abs(before.width - rect.width) > .5) {
            next[anchorId] = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
            changed = true;
          }
        });
        return changed ? next : previous;
      });
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [enabled, draft.points]);

  // Dock anchors mark real docking stations, which are rendered inside a
  // `position: sticky` layer - the station itself stays put on screen for its
  // whole section while the page scrolls under it. The anchor's own document-
  // space position (scroll + viewport%) only ever matches that on-screen spot
  // at the exact scrollY it was computed from; everywhere else it drifts,
  // since a plain absolutely-positioned element has no way to "stick" like
  // its real counterpart. Tracking each dock's live screen rect here (+ its
  // authored object offset) and switching that anchor to `position: fixed`
  // keeps it glued to the real station - but ONLY while the object is
  // actually holding there (arrival..departure scroll). The station's own
  // sticky container spans its whole section, i.e. it's already viewport-
  // fixed well before/after that hold window, while the rail is still
  // showing the real transit trajectory through document space for that
  // stretch. Tracking outside the hold window snapped the anchor to its
  // final spot early, visibly detaching it from the still-approaching rail.
  const [dockScreenPositions, setDockScreenPositions] = useState<Record<string, { x: number; y: number } | undefined>>({});
  useEffect(() => {
    if (!enabled || !resolved) return;
    const docks = resolved.route
      .filter((point): point is typeof point & { dockAnchor: string } => Boolean(point.dockAnchor))
      .map((point) => ({ id: point.dockAnchor, arrival: point.scroll, departure: point.departureScroll ?? point.scroll }));
    if (docks.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      setDockScreenPositions((previous) => {
        let changed = false;
        const next = { ...previous };
        docks.forEach(({ id: anchorId, arrival, departure }) => {
          if (scrollY < arrival || scrollY > departure) {
            if (next[anchorId]) { next[anchorId] = undefined; changed = true; }
            return;
          }
          const stationEl = document.querySelector<HTMLElement>(`[data-docking-anchor="${anchorId}"]`);
          const stage = stationEl?.parentElement;
          if (!stationEl || !stage) {
            if (next[anchorId]) { next[anchorId] = undefined; changed = true; }
            return;
          }
          const stationRect = stationEl.getBoundingClientRect();
          const stageRect = stage.getBoundingClientRect();
          const objectX = Number(stationEl.dataset.dockObjectX ?? 0);
          const objectY = Number(stationEl.dataset.dockObjectY ?? 0);
          const x = stationRect.left + stationRect.width / 2 + (objectX / 100) * stageRect.width;
          const y = stationRect.top + stationRect.height / 2 + (objectY / 100) * stageRect.height;
          const before = previous[anchorId];
          if (!before || Math.abs(before.x - x) > .5 || Math.abs(before.y - y) > .5) {
            next[anchorId] = { x, y };
            changed = true;
          }
        });
        return changed ? next : previous;
      });
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [enabled, resolved]);

  useEffect(() => {
    if (!enabled) return;
    const updateHeight = () => setDocumentHeight(document.documentElement.scrollHeight);
    updateHeight();
    window.addEventListener('resize', updateHeight);
    // Restore a previously auto-saved draft before enabling further persistence, so this
    // restoration itself doesn't immediately re-save an identical copy. Read only ever happens
    // here, gated on editor mode being confirmed - never on a production page load.
    restoreFlightPathDraftFromStorage();
    enableFlightPathDraftPersistence();
    // Test-only introspection hook so the store's real state can be verified
    // directly (not inferred from rendered pixel positions), plus the same
    // setters the UI itself calls - used to set up handle-mode combinations
    // (e.g. mirrored/corner) that no production point currently uses, so
    // those drag-math branches can still be exercised through a real drag.
    // Only ever attached in editor mode; already fully mutable via the
    // visible UI in that mode, so this adds no new capability, only a
    // faster way to reach it from a test script.
    (window as unknown as { __flightPathDebug?: unknown }).__flightPathDebug = {
      getDraft: getFlightPathDraft,
      getResolved: getResolvedFlightPath,
      getRuntime: getFlightPathRuntime,
      updatePoint: updateFlightPathPoint,
      updateStart: updateFlightPathStart,
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
    const curveInEligible = pathRouteIndex > 0;
    const curveOutEligible = !isLast;

    const curveInRawDoc = curveInEligible
      ? pathSampleToDocument({ x: point.x + handles.curveIn.x, y: point.y + handles.curveIn.y }, point.scroll, viewport)
      : null;
    const curveOutRawDoc = curveOutEligible
      ? pathSampleToDocument({ x: point.x + handles.curveOut.x, y: point.y + handles.curveOut.y }, point.scroll, viewport)
      : null;
    const curveInPixelDist = curveInRawDoc ? Math.hypot(curveInRawDoc.documentX - point.documentX, curveInRawDoc.documentY - point.documentY) : 0;
    const curveOutPixelDist = curveOutRawDoc ? Math.hypot(curveOutRawDoc.documentX - point.documentX, curveOutRawDoc.documentY - point.documentY) : 0;
    const curveInFar = curveInPixelDist > ANCHOR_HANDLE_CLEARANCE_PX;
    const curveOutFar = curveOutPixelDist > ANCHOR_HANDLE_CLEARANCE_PX;

    const dirFor = (raw: { documentX: number; documentY: number } | null, dist: number, fallback: { dx: number; dy: number }) =>
      raw && dist > 0.5 ? { dx: (raw.documentX - point.documentX) / dist, dy: (raw.documentY - point.documentY) / dist } : fallback;

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
      curveInDoc: curveInEligible && curveInFar ? curveInRawDoc : null,
      curveOutDoc: curveOutEligible && curveOutFar ? curveOutRawDoc : null,
      curveInCreatable: curveInEligible && !curveInFar,
      curveOutCreatable: curveOutEligible && !curveOutFar,
      curveInCreateDir: dirFor(curveInRawDoc, curveInPixelDist, { dx: -DEFAULT_CREATE_DIR.dx, dy: -DEFAULT_CREATE_DIR.dy }),
      curveOutCreateDir: dirFor(curveOutRawDoc, curveOutPixelDist, DEFAULT_CREATE_DIR),
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

  // Every panel input (number field or handle-mode select) below groups its own gesture into
  // exactly one undo step the same way anchor/handle dragging does: begin on focus, live-update
  // on change (so the preview tracks keystroke-by-keystroke, same store, same frame), commit on
  // blur. A select's one onChange event is wrapped synchronously instead, since there is no
  // separate focus/blur gesture to span.
  const handleFieldFocus = () => beginFlightPathHistoryEntry();
  const handleFieldBlur = () => commitFlightPathHistoryEntry();
  const handleHandleModeChange = (target: AnchorTarget, handleMode: FlightPathHandleMode) => {
    beginFlightPathHistoryEntry();
    updateAnchor(target, { handleMode });
    commitFlightPathHistoryEntry();
  };
  const handleFollowSpeedChange = (value: number) => updateFlightPathFollowSpeed(value);

  const handleResetPoint = (target: AnchorTarget) => resetFlightPathPoint(target);
  const handleResetSegment = (segmentIndex: number) => resetFlightPathSegment(segmentIndex);
  const handleResetRoute = () => {
    if (window.confirm('Gesamte Flugbahn auf den zuletzt gespeicherten Stand zurücksetzen?')) resetFlightPathRoute();
  };
  const handleDiscardDraft = () => {
    if (window.confirm('Entwurf verwerfen und zur zuletzt gespeicherten Konfiguration zurückkehren? Das kann nicht rückgängig gemacht werden.')) {
      discardFlightPathDraft();
      setSaveState({ status: 'idle' });
    }
  };

  const handleCopyConfig = async () => {
    const current = getFlightPathDraft();
    const payload = JSON.stringify({ followSpeed: current.followSpeed, start: current.start, points: current.points, dockRings: current.dockRings }, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      setCopyLabel('KOPIERT ✓');
    } catch {
      setCopyLabel('KOPIEREN FEHLGESCHLAGEN');
    }
    window.setTimeout(() => setCopyLabel('KONFIGURATION KOPIEREN'), 2200);
  };

  const handleSave = async () => {
    setSaveState({ status: 'saving' });
    const result = await saveFlightPathPersistently();
    setSaveState(result.ok ? { status: 'saved' } : { status: 'error', error: result.error });
    if (result.ok) window.setTimeout(() => setSaveState((current) => (current.status === 'saved' ? { status: 'idle' } : current)), 2600);
  };

  const handleSaveAndLeave = async () => {
    setSaveState({ status: 'saving' });
    const result = await saveFlightPathPersistently();
    if (!result.ok) {
      setSaveState({ status: 'error', error: result.error });
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('flight-editor');
    url.searchParams.delete('flightDebug');
    window.location.assign(url.toString());
  };

  let hauptankerNumber = 0;

  // A live-tracked dock anchor (see dockScreenPositions above) renders at a
  // `position: fixed` viewport spot instead of its static document position -
  // its handles and their connector lines must follow the same origin, or
  // they stay behind at the anchor's old document position while the anchor
  // itself jumps away, making the handle impossible to find/grab.
  const anchorOrigin = (anchor: AnchorView) => {
    const dockScreenPos = anchor.point.dockAnchor ? dockScreenPositions[anchor.point.dockAnchor] : undefined;
    return dockScreenPos
      ? { x: dockScreenPos.x, y: dockScreenPos.y, fixed: true as const }
      : { x: anchor.documentX, y: anchor.documentY, fixed: false as const };
  };
  const handleStyle = (anchor: AnchorView, handleDocumentX: number, handleDocumentY: number): CSSProperties => {
    const origin = anchorOrigin(anchor);
    if (!origin.fixed) return { left: handleDocumentX, top: handleDocumentY };
    return {
      position: 'fixed',
      left: origin.x + (handleDocumentX - anchor.documentX),
      top: origin.y + (handleDocumentY - anchor.documentY),
    };
  };
  // SVG can't use `position: fixed`, so the connector lines instead get the
  // document-space coordinate that currently renders at that same viewport
  // spot (fixedY + scrollY) - visually identical to the buttons above.
  const svgOrigin = (anchor: AnchorView) => {
    const origin = anchorOrigin(anchor);
    return origin.fixed ? { x: origin.x, y: origin.y + window.scrollY } : { x: origin.x, y: origin.y };
  };

  const selectedAnchor = anchors.find((anchor) => anchor.key === selectedKey) ?? null;
  const originalForSelected = selectedAnchor
    ? (selectedAnchor.target.kind === 'start' ? getOriginalFlightPathConfig().start : getOriginalFlightPathConfig().points[selectedAnchor.target.index])
    : null;

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
          {anchors.map((anchor) => {
            const origin = svgOrigin(anchor);
            return (
              <g key={`lines-${anchor.key}`}>
                {anchor.curveInDoc && <line x1={origin.x} y1={origin.y} x2={origin.x + (anchor.curveInDoc.documentX - anchor.documentX)} y2={origin.y + (anchor.curveInDoc.documentY - anchor.documentY)} />}
                {anchor.curveOutDoc && <line x1={origin.x} y1={origin.y} x2={origin.x + (anchor.curveOutDoc.documentX - anchor.documentX)} y2={origin.y + (anchor.curveOutDoc.documentY - anchor.documentY)} />}
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.flightPathNodeLayer}>
        {/* Renders first (bottom layer) so every precise point marker below -
            handles, create-affordances and main anchors alike - always wins
            pointer capture over this broad catch-all zone wherever they
            overlap. A dock's own aligned-mode handles, or a neighbouring
            control point's handles, often sit well within a ring's hit
            radius; if the ring layer were on top there, grabbing what looks
            like a small blue handle would silently drag the ring (and its
            locked flight-path point) instead - moving the real docking
            anchor and leaving the object hovering off-station. */}
        {anchors.filter((anchor) => anchor.kind === 'dock' && anchor.point.dockAnchor).map((anchor) => {
          const rect = dockRingRects[anchor.point.dockAnchor as string];
          if (!rect) return null;
          return (
            <button
              key={`ring-hit-${anchor.key}`}
              type="button"
              className={styles.flightPathRingHitZone}
              style={{ position: 'fixed', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
              onPointerDown={(event) => startAnchorDrag(event, anchor)}
              onClick={() => setSelectedKey(anchor.key)}
              aria-label={`Docking-Station ${anchor.point.dockLabel ?? ''} samt Ring verschieben`}
              data-ring-hit-zone={anchor.key}
            />
          );
        })}

        {anchors.map((anchor) => (
          <div key={`handles-${anchor.key}`}>
            {anchor.curveInDoc && (
              <button
                type="button"
                className={styles.flightBezierHandle}
                style={handleStyle(anchor, anchor.curveInDoc.documentX, anchor.curveInDoc.documentY)}
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
                style={handleStyle(anchor, anchor.curveOutDoc.documentX, anchor.curveOutDoc.documentY)}
                onPointerDown={(event) => startHandleDrag(event, anchor, 'curveOut')}
                aria-label="Ausgehenden Bézier-Griff ziehen"
                data-anchor-key={anchor.key}
                data-handle-kind="curveOut"
              >
                <i />
              </button>
            )}
            {anchor.key === selectedKey && anchor.curveInCreatable && (
              <button
                type="button"
                className={styles.flightBezierHandleCreate}
                style={handleStyle(
                  anchor,
                  anchor.documentX + anchor.curveInCreateDir.dx * ANCHOR_HANDLE_CLEARANCE_PX,
                  anchor.documentY + anchor.curveInCreateDir.dy * ANCHOR_HANDLE_CLEARANCE_PX,
                )}
                onPointerDown={(event) => startHandleDrag(event, anchor, 'curveIn')}
                aria-label="Eingehenden Bézier-Griff erzeugen"
                data-anchor-key={anchor.key}
                data-handle-kind="curveIn"
                data-handle-create="true"
              >
                <i />
              </button>
            )}
            {anchor.key === selectedKey && anchor.curveOutCreatable && (
              <button
                type="button"
                className={`${styles.flightBezierHandleCreate} ${styles.flightBezierHandleCreateOut}`}
                style={handleStyle(
                  anchor,
                  anchor.documentX + anchor.curveOutCreateDir.dx * ANCHOR_HANDLE_CLEARANCE_PX,
                  anchor.documentY + anchor.curveOutCreateDir.dy * ANCHOR_HANDLE_CLEARANCE_PX,
                )}
                onPointerDown={(event) => startHandleDrag(event, anchor, 'curveOut')}
                aria-label="Ausgehenden Bézier-Griff erzeugen"
                data-anchor-key={anchor.key}
                data-handle-kind="curveOut"
                data-handle-create="true"
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
          const dockScreenPos = anchor.point.dockAnchor ? dockScreenPositions[anchor.point.dockAnchor] : undefined;

          return (
            <button
              type="button"
              key={`node-${anchor.key}`}
              className={nodeClassFor(anchor.kind, anchor.kind === 'start', isSelected)}
              style={
                dockScreenPos
                  ? { position: 'fixed', left: dockScreenPos.x, top: dockScreenPos.y, '--node-depth': 1 } as CSSProperties
                  : { left: anchor.documentX, top: anchor.documentY, '--node-depth': 1 } as CSSProperties
              }
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

      <aside
        ref={settingsPanel.panelRef}
        style={settingsPanel.panelStyle}
        className={styles.flightPathSettingsPanel}
        data-flight-path-settings-panel
        data-collapsed={settingsCollapsed || undefined}
      >
        <div className={styles.flightPathSettingsHeader} onPointerDown={settingsPanel.startDrag} data-action="drag-settings-panel">
          <h3>FLUGBAHN-EINSTELLUNGEN</h3>
          <button
            type="button"
            className={styles.flightPathSettingsToggle}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setSettingsCollapsed((prev) => !prev)}
            aria-expanded={!settingsCollapsed}
            aria-label={settingsCollapsed ? 'Einstellungen einblenden' : 'Einstellungen ausblenden'}
            data-action="toggle-settings-panel"
          >
            {settingsCollapsed ? '▸' : '▾'}
          </button>
        </div>

        {!settingsCollapsed && (
        <>
        <label>
          FOLGEGESCHWINDIGKEIT
          <input
            type="number"
            min={.1}
            max={4}
            step={.05}
            value={draft.followSpeed}
            onFocus={handleFieldFocus}
            onBlur={handleFieldBlur}
            onChange={(event) => handleFollowSpeedChange(clamp(Number(event.target.value), .1, 4))}
            data-field="followSpeed"
          />
        </label>

        <h4>AUSGEWÄHLTER ANKER</h4>
        {selectedAnchor ? (
          <>
            <div>{selectedAnchor.kind === 'start' ? 'START' : selectedAnchor.kind === 'dock' ? (selectedAnchor.point.dockLabel ?? 'DOCK') : 'ZWISCHENANKER'} · {selectedAnchor.point.id}</div>

            <label>X <input type="number" min={2} max={98} step={.1} value={Number(selectedAnchor.point.x.toFixed(3))} onFocus={handleFieldFocus} onBlur={handleFieldBlur} onChange={(event) => updateAnchor(selectedAnchor.target, { x: clamp(Number(event.target.value), 2, 98) })} data-field="x" /></label>
            <label>Y <input type="number" min={2} max={98} step={.1} value={Number(selectedAnchor.point.y.toFixed(3))} onFocus={handleFieldFocus} onBlur={handleFieldBlur} onChange={(event) => updateAnchor(selectedAnchor.target, { y: clamp(Number(event.target.value), 2, 98) })} data-field="y" /></label>
            <label>ROTATION <input type="number" min={-180} max={180} step={.5} value={Number(selectedAnchor.point.rotation.toFixed(2))} onFocus={handleFieldFocus} onBlur={handleFieldBlur} onChange={(event) => updateAnchor(selectedAnchor.target, { rotation: clamp(Number(event.target.value), -360, 360) })} data-field="rotation" /></label>
            <label>OPAZITÄT <input type="number" min={0} max={1} step={.01} value={Number(selectedAnchor.point.opacity.toFixed(3))} onFocus={handleFieldFocus} onBlur={handleFieldBlur} onChange={(event) => updateAnchor(selectedAnchor.target, { opacity: clamp(Number(event.target.value), 0, 1) })} data-field="opacity" /></label>
            <label>SKALIERUNG <input type="number" min={.1} max={2} step={.01} value={Number(selectedAnchor.point.scale.toFixed(3))} onFocus={handleFieldFocus} onBlur={handleFieldBlur} onChange={(event) => updateAnchor(selectedAnchor.target, { scale: clamp(Number(event.target.value), .1, 2) })} data-field="scale" /></label>

            {selectedAnchor.kind === 'dock' && selectedAnchor.point.dockAnchor && (
              <>
                <h4>POSITION AUF DOCKING-STATION</h4>
                <p className={styles.flightPathSettingsEmpty}>Versatz vom Ring-Mittelpunkt, als Vielfaches des Ring-Radius (0 = Mitte, negativ = höher, positiv = tiefer).</p>
                <label
                  key={`dock-offset-x-${selectedAnchor.key}`}
                  title="Horizontaler Versatz"
                >
                  VERSATZ X
                  <input
                    type="number"
                    step=".01"
                    defaultValue={getDockOffsetRatio(selectedAnchor.point, 'x') ?? 0}
                    onFocus={handleFieldFocus}
                    onBlur={handleFieldBlur}
                    onChange={(event) => applyDockOffsetRatio(selectedAnchor.target, selectedAnchor.point, 'x', Number(event.target.value))}
                    data-field="dock-offset-x"
                  />
                </label>
                <label
                  key={`dock-offset-y-${selectedAnchor.key}`}
                  title="Vertikaler Versatz"
                >
                  VERSATZ Y
                  <input
                    type="number"
                    step=".01"
                    defaultValue={getDockOffsetRatio(selectedAnchor.point, 'y') ?? 0}
                    onFocus={handleFieldFocus}
                    onBlur={handleFieldBlur}
                    onChange={(event) => applyDockOffsetRatio(selectedAnchor.target, selectedAnchor.point, 'y', Number(event.target.value))}
                    data-field="dock-offset-y"
                  />
                </label>
              </>
            )}

            <label>
              HANDLE-MODUS
              <select
                value={selectedAnchor.point.handleMode ?? 'aligned'}
                onChange={(event) => handleHandleModeChange(selectedAnchor.target, event.target.value as FlightPathHandleMode)}
                data-field="handleMode"
              >
                <option value="mirrored">mirrored</option>
                <option value="aligned">aligned</option>
                <option value="free">free</option>
                <option value="corner">corner</option>
              </select>
            </label>

            {originalForSelected && (
              <button type="button" onClick={() => handleResetPoint(selectedAnchor.target)} data-action="reset-point">
                DIESEN PUNKT ZURÜCKSETZEN
              </button>
            )}
            <div className={styles.flightPathSettingsRow}>
              {selectedAnchor.pathRouteIndex > 0 && (
                <button type="button" onClick={() => handleResetSegment(selectedAnchor.pathRouteIndex - 1)} data-action="reset-segment-before">
                  SEGMENT DAVOR
                </button>
              )}
              {selectedAnchor.pathRouteIndex < pathRoute.length - 1 && (
                <button type="button" onClick={() => handleResetSegment(selectedAnchor.pathRouteIndex)} data-action="reset-segment-after">
                  SEGMENT DANACH
                </button>
              )}
            </div>
          </>
        ) : (
          <div className={styles.flightPathSettingsEmpty}>Kein Anker ausgewählt - auf einen Ankerpunkt klicken.</div>
        )}

        <h4>VERLAUF</h4>
        <div className={styles.flightPathSettingsRow}>
          <button type="button" onClick={() => undoFlightPath()} disabled={!historyState.canUndo} data-action="undo">RÜCKGÄNGIG</button>
          <button type="button" onClick={() => redoFlightPath()} disabled={!historyState.canRedo} data-action="redo">WIEDERHOLEN</button>
        </div>

        <h4>ENTWURF</h4>
        <button type="button" onClick={handleResetRoute} data-action="reset-route">GESAMTE ROUTE ZURÜCKSETZEN</button>
        <button type="button" className={styles.flightPathSettingsDanger} onClick={handleDiscardDraft} data-action="discard-draft">ENTWURF VERWERFEN</button>
        <button type="button" onClick={handleCopyConfig} data-action="copy-config">{copyLabel}</button>

        <h4>SPEICHERN</h4>
        <div className={styles.flightPathSettingsRow}>
          <button type="button" className={styles.flightPathSettingsPrimary} onClick={handleSave} disabled={saveState.status === 'saving'} data-action="save">
            {saveState.status === 'saving' ? 'SPEICHERT…' : 'SPEICHERN'}
          </button>
          <button type="button" onClick={handleSaveAndLeave} disabled={saveState.status === 'saving'} data-action="save-and-leave">
            SPEICHERN &amp; VERLASSEN
          </button>
        </div>
        {saveState.status === 'saved' && <div className={styles.flightPathSettingsOk} data-save-status="saved">Gespeichert ✓</div>}
        {saveState.status === 'error' && <div className={styles.flightPathSettingsError} data-save-status="error">{saveState.error}</div>}
        </>
        )}
      </aside>
    </div>
  );
}
