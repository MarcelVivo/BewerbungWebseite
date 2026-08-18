import type { FlightPathPoint } from './flightPathTypes';

export const DOCKING_STOPS = [
  { sectionId: 'fragmentierung', anchor: 'problem', rest: .48, pointOccurrence: 2, number: '01', label: 'PROBLEM / FRAGMENTIERUNG' },
  { sectionId: 'journey-solutions', anchor: 'system', rest: .42, pointOccurrence: 1, number: '02', label: 'SYSTEM' },
  { sectionId: 'verkaufssystem', anchor: 'website', rest: .48, pointOccurrence: 1, number: '03', label: 'WEBSITE / VERKAUF' },
  { sectionId: 'marketing-engine', anchor: 'marketing', rest: .48, pointOccurrence: 1, number: '04', label: 'MARKETING' },
  { sectionId: 'business-os', anchor: 'process', rest: .45, pointOccurrence: 2, number: '05', label: 'PROZESSE' },
  { sectionId: 'daten-intelligenz', anchor: 'data', rest: .45, pointOccurrence: 1, number: '06', label: 'DATEN' },
  { sectionId: 'journey-references', anchor: 'projects', rest: .45, pointOccurrence: 1, number: '07', label: 'PROJEKTE' },
  { sectionId: 'journey-about', anchor: 'about', rest: .45, pointOccurrence: 1, number: '08', label: 'UEBER MICH' },
  { sectionId: 'journey-contact', anchor: 'contact', rest: .42, pointOccurrence: 1, number: '09', label: 'KONTAKT' },
] as const;

export type DockingStop = (typeof DOCKING_STOPS)[number];
export type DockAnchor = DockingStop['anchor'];

/** Keeps one ordered global point list and only annotates its docking anchors.
 * Free points are deliberately never collapsed, so every span may contain a
 * different number of editable waypoints without creating section curves.
 */
export function normalizeDockingPoints(source: FlightPathPoint[]): FlightPathPoint[] {
  const points: FlightPathPoint[] = source.map((point) => ({
    ...point,
    type: point.dockAnchor ? 'dock' as const : 'control' as const,
    handleMode: point.handleMode ?? 'aligned',
    curveIn: point.curveIn ? { ...point.curveIn, z: Number(point.curveIn.z) || 0 } : undefined,
    curveOut: point.curveOut ? { ...point.curveOut, z: Number(point.curveOut.z) || 0 } : undefined,
  }));
  const claimedIndexes = new Set<number>();

  DOCKING_STOPS.forEach((stop) => {
    let dockIndex = points.findIndex((point, index) => !claimedIndexes.has(index) && point.dockAnchor === stop.anchor);
    if (dockIndex < 0) {
      const candidates = points.flatMap((point, index) => !claimedIndexes.has(index) && point.id === stop.sectionId ? [index] : []);
      dockIndex = candidates[Math.min(stop.pointOccurrence, candidates.length - 1)] ?? -1;
    }
    if (dockIndex < 0) return;
    points[dockIndex] = {
      ...points[dockIndex],
      dockAnchor: stop.anchor,
      dockNumber: stop.number,
      dockLabel: stop.label,
      dockLocked: true,
      type: 'dock',
      handleMode: points[dockIndex].handleMode ?? 'aligned',
    };
    claimedIndexes.add(dockIndex);
  });

  return points;
}

export const dockingStopForAnchor = (anchor?: string) => DOCKING_STOPS.find((stop) => stop.anchor === anchor);
export const dockingStopForSectionId = (sectionId?: string) => DOCKING_STOPS.find((stop) => stop.sectionId === sectionId);

/** The scrollY at which a station's docking ring is actually in its held
 *  "resting" position - mirrors the same arrival formula ScrollEntity.tsx
 *  uses to resolve each dock's own "arrived" scrollY, so this always
 *  matches where the flying object visually settles, not just "the
 *  section is on screen". */
function dockingRestScrollY(stop: DockingStop): number | null {
  const section = document.getElementById(stop.sectionId);
  if (!section) return null;
  const rect = section.getBoundingClientRect();
  const absoluteTop = window.scrollY + rect.top;
  const viewportHeight = window.innerHeight;
  const scroll = absoluteTop + Math.max(section.offsetHeight - viewportHeight, viewportHeight * .65, 1) * stop.rest;
  return Math.max(0, scroll);
}

/** Prev/next neighbours in page order for the `?dock-editor=<station>` calibrator's
 *  station-to-station navigation - null past either end (problem has no prev, contact no next). */
export function neighboringDockingStops(anchor: string): { prev: DockingStop | null; next: DockingStop | null } {
  const index = DOCKING_STOPS.findIndex((stop) => stop.anchor === anchor);
  return {
    prev: index > 0 ? DOCKING_STOPS[index - 1] : null,
    next: index >= 0 && index < DOCKING_STOPS.length - 1 ? DOCKING_STOPS[index + 1] : null,
  };
}

/** Scrolls to the exact scrollY at which this station's ring is actually
 *  docked/visible - a plain scrollIntoView() on the section only guarantees
 *  the section itself is on screen, not that its sticky docking layer has
 *  reached its held position within that (often multi-viewport-tall)
 *  section. Mirrors the same arrival formula ScrollEntity.tsx uses to
 *  resolve each dock's own "arrived" scrollY. */
export function scrollToDockingStation(anchor: string) {
  const stop = dockingStopForAnchor(anchor);
  if (!stop) return;
  const jump = () => {
    const scroll = dockingRestScrollY(stop);
    if (scroll !== null) window.scrollTo({ top: scroll, behavior: 'auto' });
  };
  // Late-loading media/fonts still shift section heights well after mount,
  // which silently invalidates a scroll computed too early - one immediate
  // jump plus a couple of re-corrections once the page has actually settled.
  jump();
  window.setTimeout(jump, 300);
  window.setTimeout(jump, 900);
}

