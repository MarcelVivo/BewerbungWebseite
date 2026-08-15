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

let draft: FlightPathConfig = normalizeConfig({
  followSpeed: raw.followSpeed ?? 1,
  start: raw.start ?? DEFAULT_START,
  points: raw.points.map((point) => ({ ...point })),
  dockRings: Object.fromEntries(Object.entries(DOCK_RING_DEFAULTS).map(([anchor, position]) => [anchor, { x: position.x, y: position.y }])),
});
const draftListeners = new Set<() => void>();

export function getFlightPathDraft(): FlightPathConfig {
  return draft;
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

export function updateDockRingPosition(anchor: string, patch: Partial<DockRingPosition>) {
  const current = draft.dockRings[anchor];
  if (!current) return;
  setFlightPathDraft({ ...draft, dockRings: { ...draft.dockRings, [anchor]: { ...current, ...patch } } });
}

export function subscribeFlightPathDraft(listener: () => void) {
  draftListeners.add(listener);
  return () => { draftListeners.delete(listener); };
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

const notifyHistory = () => historyListeners.forEach((listener) => listener());

export function beginFlightPathHistoryEntry() {
  pendingHistorySnapshot = draft;
}

export function commitFlightPathHistoryEntry() {
  const before = pendingHistorySnapshot;
  pendingHistorySnapshot = null;
  if (!before || before === draft) return;
  undoStack.push(before);
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
  notifyHistory();
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
}

export function redoFlightPath() {
  const next = redoStack.pop();
  if (!next) return;
  undoStack.push(draft);
  draft = normalizeConfig(next);
  draftListeners.forEach((listener) => listener());
  notifyHistory();
}

export function getFlightPathHistoryState() {
  return { canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 };
}

export function subscribeFlightPathHistory(listener: () => void) {
  historyListeners.add(listener);
  return () => { historyListeners.delete(listener); };
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
