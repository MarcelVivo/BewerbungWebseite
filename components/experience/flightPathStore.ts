'use client';

/**
 * The single source of truth for the flight path. ScrollEntity (the real
 * object), FlightPathEditor (drag UI) and every docking-station ring read
 * and write through this module only - none of them may keep its own local
 * copy of a point, its own CurvePath/FlightPathModel instance, its own SVG
 * sampling, or (for docking stations) its own locally-seeded ring position.
 *
 * Plain module-level state + a subscribe/notify pattern, compatible with
 * React's built-in useSyncExternalStore. No new dependency.
 */

import rawFlightPath from './flight-path.json';
import heroDock from './hero-dock.json';
import problemDock from './problem-dock.json';
import systemDock from './system-dock.json';
import websiteDock from './website-dock.json';
import marketingDock from './marketing-dock.json';
import processDock from './process-dock.json';
import dataDock from './data-dock.json';
import projectsDock from './projects-dock.json';
import aboutDock from './about-dock.json';
import contactDock from './contact-dock.json';
import { normalizeDockingPoints } from './dockingRoute';
import type { DockRingPosition, FlightPathConfig, FlightPathPoint } from './flightPathTypes';
import type { FlightPathModel } from './masterFlightPath';
import type { DockProgressPoint, ScrollPathPhase } from './scrollPathController';

export type ResolvedFlightPathPoint = FlightPathPoint & {
  scroll: number;
  documentX: number;
  documentY: number;
  departureScroll?: number;
};

export type ResolvedFlightPath = {
  /** The draft's points, resolved to real scroll/document positions. Same order/indices as the draft. */
  route: ResolvedFlightPathPoint[];
  /** route with the start point prepended - what the MasterFlightPath instance was actually built from. */
  pathRoute: ResolvedFlightPathPoint[];
  /** The one FlightPathModel instance for this snapshot. Object position, SVG rail, editor anchors and the
   *  precision-test all sample this same instance - never a second one built independently. */
  masterPath: FlightPathModel;
  dockingProgress: DockProgressPoint[];
  /** Document-space SVG path string, sampled by real scrollY (see resolveDocumentRail in ScrollEntity). */
  railPath: string;
  viewportWidth: number;
  viewportHeight: number;
};

export type FlightPathRuntimeState = {
  currentPathProgress: number;
  targetPathProgress: number;
  station: string;
  activeSectionId: string;
  phase: ScrollPathPhase;
  /** Finer-grained label derived from phase + section/transit progress, for the debug panel only. */
  phaseLabel: 'TRANSIT' | 'ARRIVAL' | 'HOLD' | 'DEPARTURE';
  segmentIndex: number;
  /** The rendered object wrapper's position, in the same 0-100 path space as every other point. */
  x: number;
  y: number;
  scale: number;
  routeScroll: number;
  scrollY: number;
  /** Independent DOM/SVG measurement in px between the object wrapper's getBoundingClientRect() center
   *  and the rail path's getPointAtLength()+getScreenCTM() point at the same document Y - not derived
   *  from re-reading this store, so it actually verifies what the browser paints. */
  distancePx: number;
};

const raw = rawFlightPath as { followSpeed?: number; start?: FlightPathPoint; points: FlightPathPoint[] };

const DEFAULT_START: FlightPathPoint = {
  id: 'journey-start',
  sectionOffset: 0,
  x: 50,
  y: 20,
  scale: .95,
  rotation: -6,
  opacity: .96,
  type: 'start',
  handleMode: 'aligned',
};

const DOCK_RING_DEFAULTS: Record<string, DockRingPosition> = {
  hero: heroDock,
  problem: problemDock,
  system: systemDock,
  website: websiteDock,
  marketing: marketingDock,
  process: processDock,
  data: dataDock,
  projects: projectsDock,
  about: aboutDock,
  contact: contactDock,
};

const normalizeConfig = (config: { followSpeed: number; start: FlightPathPoint; points: FlightPathPoint[]; dockRings: Record<string, DockRingPosition> }): FlightPathConfig => ({
  followSpeed: config.followSpeed,
  start: { ...config.start, type: 'start' },
  points: normalizeDockingPoints(config.points),
  dockRings: config.dockRings,
});

/** The as-shipped configuration (production flight-path.json + the 10 *-dock.json files), fixed at
 *  module load and never mutated - the reference every reset/discard action reverts to. Never
 *  exposed for direct mutation; callers only ever get a fresh copy via the functions below. */
const ORIGINAL_CONFIG: FlightPathConfig = normalizeConfig({
  followSpeed: raw.followSpeed ?? 1,
  start: raw.start ?? DEFAULT_START,
  points: raw.points.map((point) => ({ ...point })),
  dockRings: Object.fromEntries(Object.entries(DOCK_RING_DEFAULTS).map(([anchor, position]) => [anchor, { x: position.x, y: position.y }])),
});

const cloneConfig = (config: FlightPathConfig): FlightPathConfig => ({
  followSpeed: config.followSpeed,
  start: { ...config.start },
  points: config.points.map((point) => ({ ...point })),
  dockRings: Object.fromEntries(Object.entries(config.dockRings).map(([anchor, position]) => [anchor, { ...position }])),
});

let draft: FlightPathConfig = cloneConfig(ORIGINAL_CONFIG);
const draftListeners = new Set<() => void>();

export function getFlightPathDraft(): FlightPathConfig {
  return draft;
}

/** A frozen-in-time copy of what's on disk right now, for reset actions and for detecting
 *  whether the draft actually differs from it. Always a fresh clone - never the shared instance. */
export function getOriginalFlightPathConfig(): FlightPathConfig {
  return cloneConfig(ORIGINAL_CONFIG);
}

export function setFlightPathDraft(next: FlightPathConfig) {
  draft = normalizeConfig(next);
  draftListeners.forEach((listener) => listener());
}

export function updateFlightPathPoint(index: number, patch: Partial<FlightPathPoint>) {
  const point = draft.points[index];
  if (!point) return;
  const points = draft.points.slice();
  points[index] = { ...point, ...patch };
  setFlightPathDraft({ ...draft, points });
}

export function updateFlightPathStart(patch: Partial<FlightPathPoint>) {
  setFlightPathDraft({ ...draft, start: { ...draft.start, ...patch } });
}

export function updateFlightPathFollowSpeed(followSpeed: number) {
  setFlightPathDraft({ ...draft, followSpeed });
}

export function updateDockRingPosition(anchor: string, patch: Partial<DockRingPosition>) {
  const current = draft.dockRings[anchor];
  if (!current) return;
  setFlightPathDraft({ ...draft, dockRings: { ...draft.dockRings, [anchor]: { ...current, ...patch } } });
}

export function subscribeFlightPathDraft(listener: () => void) {
  draftListeners.add(listener);
  return () => { draftListeners.delete(listener); };
}

// ---- localStorage draft persistence (editor mode only) ----
// A versioned envelope so a draft saved by an older editor build is recognized as stale and
// discarded, rather than applied and misinterpreted. Only ever read/written once
// enableFlightPathDraftPersistence() has been called - by FlightPathEditor's own mount effect,
// itself gated on the flight-editor/flightDebug URL params - so production page loads never
// touch localStorage for this key at all.
const DRAFT_STORAGE_KEY = 'ms-flight-path-draft-v1';
const DRAFT_STORAGE_VERSION = 1;
let draftPersistenceEnabled = false;

type StoredDraftEnvelope = { version: number; savedAt: number; config: FlightPathConfig };

const isDockRingRecord = (value: unknown): value is Record<string, DockRingPosition> =>
  !!value && typeof value === 'object' && Object.values(value as Record<string, unknown>).every((entry) =>
    !!entry && typeof entry === 'object' && typeof (entry as DockRingPosition).x === 'number' && typeof (entry as DockRingPosition).y === 'number');

const isStoredConfigShape = (value: unknown): value is FlightPathConfig => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.followSpeed === 'number'
    && !!candidate.start && typeof candidate.start === 'object'
    && Array.isArray(candidate.points)
    && isDockRingRecord(candidate.dockRings);
};

export function enableFlightPathDraftPersistence() {
  draftPersistenceEnabled = true;
}

function persistDraftToStorage() {
  if (!draftPersistenceEnabled || typeof window === 'undefined') return;
  try {
    const envelope: StoredDraftEnvelope = { version: DRAFT_STORAGE_VERSION, savedAt: Date.now(), config: draft };
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Storage unavailable/full - the editor keeps working, just without a local safety copy.
  }
}

export function clearFlightPathDraftStorage() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); } catch { /* nothing to clear */ }
}

/** Applies a previously stored draft if one exists and matches the current version - called once
 *  from FlightPathEditor's mount effect, only in editor mode. Returns whether a draft was applied. */
export function restoreFlightPathDraftFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<StoredDraftEnvelope>;
    if (parsed.version !== DRAFT_STORAGE_VERSION || !isStoredConfigShape(parsed.config)) {
      clearFlightPathDraftStorage();
      return false;
    }
    draft = normalizeConfig(parsed.config);
    draftListeners.forEach((listener) => listener());
    return true;
  } catch {
    clearFlightPathDraftStorage();
    return false;
  }
}

export function hasStoredFlightPathDraft(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem(DRAFT_STORAGE_KEY) !== null; } catch { return false; }
}

// ---- Undo/redo: one entry per completed drag gesture, not per pointermove ----
// beginFlightPathHistoryEntry() snapshots the pre-drag draft; every update call
// during the drag mutates `draft` live (so the rail/object update every frame)
// without touching the history stacks. commitFlightPathHistoryEntry() pushes
// that one pre-drag snapshot exactly once, iff the drag actually changed
// anything - never a snapshot per pointermove.
let pendingHistorySnapshot: FlightPathConfig | null = null;
const undoStack: FlightPathConfig[] = [];
const redoStack: FlightPathConfig[] = [];
const historyListeners = new Set<() => void>();

/** useSyncExternalStore requires getSnapshot() to return a referentially-stable value when
 *  nothing changed - a fresh {canUndo, canRedo} object literal on every call breaks that
 *  contract and sends React into "getServerSnapshot should be cached" territory (and, worse,
 *  an actual render loop client-side too, not just during SSR). Cache the object and only
 *  replace it - here, the one place undoStack/redoStack ever change - when the booleans
 *  actually flip. */
let cachedHistoryState = { canUndo: false, canRedo: false };
const notifyHistory = () => {
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  if (canUndo !== cachedHistoryState.canUndo || canRedo !== cachedHistoryState.canRedo) {
    cachedHistoryState = { canUndo, canRedo };
  }
  historyListeners.forEach((listener) => listener());
};

/** Shared by the drag-commit path and every reset/programmatic-change function below: records
 *  exactly one undo step for a settled (non-live) change, iff it actually changed anything, and
 *  persists the new draft. This is the single place that pushes onto undoStack, so a slider
 *  drag, a handle drag, and a reset button all produce the same "one gesture, one undo step"
 *  guarantee. */
function commitSettledChange(before: FlightPathConfig) {
  if (before === draft) return;
  undoStack.push(before);
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
  notifyHistory();
  persistDraftToStorage();
}

export function beginFlightPathHistoryEntry() {
  pendingHistorySnapshot = draft;
}

export function commitFlightPathHistoryEntry() {
  const before = pendingHistorySnapshot;
  pendingHistorySnapshot = null;
  if (!before) return;
  commitSettledChange(before);
}

export function cancelFlightPathHistoryEntry() {
  const before = pendingHistorySnapshot;
  pendingHistorySnapshot = null;
  if (before && before !== draft) {
    draft = before;
    draftListeners.forEach((listener) => listener());
  }
}

export function undoFlightPath() {
  const previous = undoStack.pop();
  if (!previous) return;
  redoStack.push(draft);
  draft = normalizeConfig(previous);
  draftListeners.forEach((listener) => listener());
  notifyHistory();
  persistDraftToStorage();
}

export function redoFlightPath() {
  const next = redoStack.pop();
  if (!next) return;
  undoStack.push(draft);
  draft = normalizeConfig(next);
  draftListeners.forEach((listener) => listener());
  notifyHistory();
  persistDraftToStorage();
}

export function getFlightPathHistoryState() {
  return cachedHistoryState;
}

export function subscribeFlightPathHistory(listener: () => void) {
  historyListeners.add(listener);
  return () => { historyListeners.delete(listener); };
}

/** Identifies a single anchor - the start point or one indexed entry in draft.points - the same
 *  shape FlightPathEditor's own drag/selection code already uses, exported here so reset actions
 *  and the editor agree on one definition instead of two structurally-identical copies. */
export type FlightPathAnchorTarget = { kind: 'start' } | { kind: 'point'; index: number };

const pathRouteOf = (config: FlightPathConfig): FlightPathPoint[] => [config.start, ...config.points];

/** Resets one anchor's spatial state (position + both handles + handle mode) to what shipped in
 *  production. If it's a dock, its ring position resets atomically with it - a dock point and its
 *  ring are never allowed to drift apart, reset included. Never touches rest/hold scroll timing
 *  (that lives in DOCKING_STOPS, untouched by any function in this module). One undo step. */
export function resetFlightPathPoint(target: FlightPathAnchorTarget) {
  const before = draft;
  const original = target.kind === 'start' ? ORIGINAL_CONFIG.start : ORIGINAL_CONFIG.points[target.index];
  if (!original) return;
  let next: FlightPathConfig = target.kind === 'start'
    ? { ...draft, start: { ...original } }
    : { ...draft, points: draft.points.map((point, index) => (index === target.index ? { ...original } : point)) };
  const dockAnchor = original.dockAnchor;
  if (dockAnchor && ORIGINAL_CONFIG.dockRings[dockAnchor]) {
    next = { ...next, dockRings: { ...next.dockRings, [dockAnchor]: { ...ORIGINAL_CONFIG.dockRings[dockAnchor] } } };
  }
  draft = normalizeConfig(next);
  draftListeners.forEach((listener) => listener());
  commitSettledChange(before);
}

/** Resets one Bezier segment's shape: the outgoing handle of pathRoute[segmentIndex] and the
 *  incoming handle of pathRoute[segmentIndex + 1] (exactly the two handles that define that one
 *  master-curve piece - see masterFlightPath.ts's build()) back to their production values.
 *  Touches no anchor position and no other segment's handles. One undo step. */
export function resetFlightPathSegment(segmentIndex: number) {
  const before = draft;
  const originalRoute = pathRouteOf(ORIGINAL_CONFIG);
  const originalA = originalRoute[segmentIndex];
  const originalB = originalRoute[segmentIndex + 1];
  if (!originalA || !originalB) return;

  const targetFor = (pathRouteIndex: number): FlightPathAnchorTarget =>
    (pathRouteIndex === 0 ? { kind: 'start' } : { kind: 'point', index: pathRouteIndex - 1 });
  const applyPatch = (config: FlightPathConfig, target: FlightPathAnchorTarget, patch: Partial<FlightPathPoint>): FlightPathConfig =>
    (target.kind === 'start'
      ? { ...config, start: { ...config.start, ...patch } }
      : { ...config, points: config.points.map((point, index) => (index === target.index ? { ...point, ...patch } : point)) });

  let next = applyPatch(draft, targetFor(segmentIndex), { curveOut: originalA.curveOut });
  next = applyPatch(next, targetFor(segmentIndex + 1), { curveIn: originalB.curveIn });
  draft = normalizeConfig(next);
  draftListeners.forEach((listener) => listener());
  commitSettledChange(before);
}

/** Resets the entire draft (start, every point, every dock ring, followSpeed) to production
 *  values, in one undo step - unlike discardFlightPathDraft(), this stays inside the normal
 *  history, so it can itself be undone. */
export function resetFlightPathRoute() {
  const before = draft;
  draft = cloneConfig(ORIGINAL_CONFIG);
  draftListeners.forEach((listener) => listener());
  commitSettledChange(before);
}

/** Throws the working draft away entirely: resets to production values AND clears both undo
 *  history and the localStorage safety copy. Unlike resetFlightPathRoute(), this is not itself
 *  undoable - it is the "start completely over" action. */
export function discardFlightPathDraft() {
  draft = cloneConfig(ORIGINAL_CONFIG);
  draftListeners.forEach((listener) => listener());
  undoStack.length = 0;
  redoStack.length = 0;
  notifyHistory();
  clearFlightPathDraftStorage();
}

export type FlightPathSaveResult = { ok: true } | { ok: false; error: string };

/** Writing flight-path.json (a statically-imported module) briefly invalidates the dev server's
 *  compilation unit, which can make the very next request 404/500 even though nothing is actually
 *  wrong - so each save request gets a couple of quick retries before it's treated as a real
 *  failure. Dock writes are idempotent (same station, same payload), so retrying is always safe. */
async function postJsonWithRetry(url: string, body: unknown, attempts = 3, delayMs = 400): Promise<Response> {
  let last: Response | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) return response;
    last = response;
  }
  return last as Response;
}

/** Persists the current draft through the two existing APIs: /api/flight-path for the route
 *  itself (start + points + followSpeed - the exact shape flight-path.json is on disk), then
 *  /api/docking-config once per station for its ring position. Each dock station's non-position
 *  fields (scale/width/height/rotation/tilt/objectX/objectY) were never editable in this editor,
 *  so they're taken unchanged from the same *-dock.json import the store seeded dockRings from -
 *  only x/y come from the draft, keeping ring position and the rest of that station's config
 *  consistent in one write per station. All requests must succeed for the save to count as
 *  successful; on any failure the draft (in memory and in localStorage) is left untouched so nothing
 *  is lost, and a message identifying which part failed is returned for the panel to show. */
export async function saveFlightPathPersistently(): Promise<FlightPathSaveResult> {
  try {
    const flightPathResponse = await postJsonWithRetry('/api/flight-path', {
      followSpeed: draft.followSpeed,
      start: draft.start,
      points: draft.points,
    });
    if (!flightPathResponse.ok) {
      const body = await flightPathResponse.json().catch(() => null) as { error?: string } | null;
      return { ok: false, error: body?.error ?? `Flugbahn konnte nicht gespeichert werden (Status ${flightPathResponse.status}).` };
    }

    for (const [anchor, fullDefaults] of Object.entries(DOCK_RING_DEFAULTS)) {
      const current = draft.dockRings[anchor];
      if (!current) continue;
      const payload = { ...fullDefaults, x: current.x, y: current.y };
      const response = await postJsonWithRetry(`/api/docking-config?station=${anchor}`, payload);
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        return { ok: false, error: body?.error ?? `Docking-Station "${anchor}" konnte nicht gespeichert werden (Status ${response.status}).` };
      }
    }

    clearFlightPathDraftStorage();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern.' };
  }
}

let resolved: ResolvedFlightPath | null = null;
const resolvedListeners = new Set<() => void>();

export function getResolvedFlightPath(): ResolvedFlightPath | null {
  return resolved;
}

/** Called exactly once per resolve pass, by ScrollEntity only. */
export function setResolvedFlightPath(next: ResolvedFlightPath) {
  resolved = next;
  resolvedListeners.forEach((listener) => listener());
}

export function subscribeResolvedFlightPath(listener: () => void) {
  resolvedListeners.add(listener);
  return () => { resolvedListeners.delete(listener); };
}

let runtime: FlightPathRuntimeState | null = null;
const runtimeListeners = new Set<() => void>();

export function getFlightPathRuntime(): FlightPathRuntimeState | null {
  return runtime;
}

/** Called every animation frame, by ScrollEntity only, and only while the editor is active. */
export function setFlightPathRuntime(next: FlightPathRuntimeState) {
  runtime = next;
  runtimeListeners.forEach((listener) => listener());
}

export function subscribeFlightPathRuntime(listener: () => void) {
  runtimeListeners.add(listener);
  return () => { runtimeListeners.delete(listener); };
}
