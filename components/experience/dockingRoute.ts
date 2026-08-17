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
