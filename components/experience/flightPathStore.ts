'use client';

/**
 * The single source of truth for the flight path. Both ScrollEntity (the
 * real object) and FlightPathEditor (the debug rail) read and write through
 * this module only - neither may keep its own local copy of the points, its
 * own CurvePath/FlightPathModel instance, or its own SVG sampling.
 *
 * Plain module-level state + a subscribe/notify pattern, compatible with
 * React's built-in useSyncExternalStore. No new dependency.
 */

import rawFlightPath from './flight-path.json';
import { normalizeDockingPoints } from './dockingRoute';
import type { FlightPathConfig, FlightPathPoint } from './flightPathTypes';
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
  /** route with the fixed intro point prepended - what the MasterFlightPath instance was actually built from. */
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

const raw = rawFlightPath as { followSpeed?: number; points: FlightPathPoint[] };

let draft: FlightPathConfig = {
  followSpeed: raw.followSpeed ?? 1,
  points: normalizeDockingPoints(raw.points.map((point) => ({ ...point }))),
};
const draftListeners = new Set<() => void>();

export function getFlightPathDraft(): FlightPathConfig {
  return draft;
}

export function setFlightPathDraft(next: FlightPathConfig) {
  draft = { followSpeed: next.followSpeed, points: normalizeDockingPoints(next.points) };
  draftListeners.forEach((listener) => listener());
}

export function updateFlightPathPoint(index: number, patch: Partial<FlightPathPoint>) {
  const point = draft.points[index];
  if (!point) return;
  const points = draft.points.slice();
  points[index] = { ...point, ...patch };
  setFlightPathDraft({ ...draft, points });
}

export function subscribeFlightPathDraft(listener: () => void) {
  draftListeners.add(listener);
  return () => { draftListeners.delete(listener); };
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
