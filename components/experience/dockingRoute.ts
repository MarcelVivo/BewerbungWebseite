import type { FlightPathConfig, FlightPathPoint } from './flightPathTypes';

export const FLIGHT_PATH_START_POINT: FlightPathPoint = {
  id: 'journey-start',
  sectionOffset: 0,
  x: 50,
  y: 12,
  scale: 0.95,
  rotation: -6,
  opacity: .96,
  type: 'control',
  handleMode: 'aligned',
};

export const DOCKING_STOPS = [
  { sectionId: 'journey-start', anchor: 'hero', rest: 0, pointOccurrence: 0, number: '01', label: 'START' },
  { sectionId: 'fragmentierung', anchor: 'problem', rest: .48, pointOccurrence: 2, number: '02', label: 'PROBLEM / FRAGMENTIERUNG' },
  { sectionId: 'journey-solutions', anchor: 'system', rest: .42, pointOccurrence: 1, number: '03', label: 'SYSTEM' },
  { sectionId: 'verkaufssystem', anchor: 'website', rest: .48, pointOccurrence: 1, number: '04', label: 'WEBSITE / VERKAUF' },
  { sectionId: 'marketing-engine', anchor: 'marketing', rest: .48, pointOccurrence: 1, number: '05', label: 'MARKETING' },
  { sectionId: 'business-os', anchor: 'process', rest: .45, pointOccurrence: 2, number: '06', label: 'PROZESSE' },
  { sectionId: 'daten-intelligenz', anchor: 'data', rest: .45, pointOccurrence: 1, number: '07', label: 'DATEN' },
  { sectionId: 'journey-references', anchor: 'projects', rest: .45, pointOccurrence: 1, number: '08', label: 'PROJEKTE' },
  { sectionId: 'journey-about', anchor: 'about', rest: .45, pointOccurrence: 1, number: '09', label: 'UEBER MICH' },
  { sectionId: 'journey-contact', anchor: 'contact', rest: .42, pointOccurrence: 1, number: '10', label: 'KONTAKT' },
] as const;

export type DockingStop = (typeof DOCKING_STOPS)[number];
export type DockAnchor = DockingStop['anchor'];
export type DockPlacement = { x: number; y: number; routeScroll: number; scale: number };

export function resolveDockPlacement(stop: DockingStop): DockPlacement | null {
  const section = document.getElementById(stop.sectionId);
  const anchor = section?.querySelector<HTMLElement>(`[data-docking-anchor="${stop.anchor}"]`);
  const stage = anchor?.parentElement;
  if (!section || !anchor || !stage) return null;

  const viewportHeight = Math.max(window.innerHeight, 1);
  const viewportWidth = Math.max(window.innerWidth, 1);
  const sectionRect = section.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const sectionTop = window.scrollY + sectionRect.top;
  const stageDocumentTop = window.scrollY + stageRect.top;
  const stageStyle = window.getComputedStyle(stage);
  const anchorRect = anchor.getBoundingClientRect();
  const xPercent = Number.parseFloat(anchor.style.left)
    || (anchorRect.left + anchorRect.width * .5 - stageRect.left) / Math.max(stageRect.width, 1) * 100;
  const yPercent = Number.parseFloat(anchor.style.top)
    || (anchorRect.top + anchorRect.height * .5 - stageRect.top) / Math.max(stageRect.height, 1) * 100;
  let stickyAncestor: HTMLElement | null = stage;
  while (stickyAncestor && stickyAncestor !== section && window.getComputedStyle(stickyAncestor).position !== 'sticky') {
    stickyAncestor = stickyAncestor.parentElement;
  }
  if (stickyAncestor === section && window.getComputedStyle(stickyAncestor).position !== 'sticky') stickyAncestor = null;
  const pinned = Boolean(stickyAncestor) || stageStyle.position === 'sticky' || stop.anchor === 'hero';
  const sectionDistance = Math.max(section.offsetHeight - viewportHeight, viewportHeight * .65, 1);
  const routeScroll = stop.anchor === 'hero'
    ? Math.max(0, sectionTop + viewportHeight * .62)
    : Math.max(0, sectionTop + sectionDistance * stop.rest);
  const anchorDocumentY = stageDocumentTop + stageRect.height * yPercent / 100;
  const stickyRect = stickyAncestor?.getBoundingClientRect();
  const stickyStyle = stickyAncestor ? window.getComputedStyle(stickyAncestor) : stageStyle;
  const anchorCenterY = anchorRect.top + anchorRect.height * .5;
  const screenY = pinned && stickyRect
    ? (Number.parseFloat(stickyStyle.top) || 0) + anchorCenterY - stickyRect.top
    : pinned
      ? (Number.parseFloat(stageStyle.top) || 0) + stageRect.height * yPercent / 100
      : anchorDocumentY - routeScroll;
  const screenX = stageRect.left + stageRect.width * xPercent / 100;

  return {
    x: Math.min(97, Math.max(3, screenX / viewportWidth * 100)),
    y: Math.min(97, Math.max(3, screenY / viewportHeight * 100)),
    routeScroll,
    scale: Number(anchor.dataset.dockScale) || .7,
  };
}

const midpoint = (from: FlightPathPoint, to: FlightPathPoint, template?: FlightPathPoint): FlightPathPoint => ({
  id: template?.id ?? to.id,
  sectionOffset: template?.sectionOffset ?? (from.sectionOffset + to.sectionOffset) * .5,
  x: template?.x ?? (from.x + to.x) * .5,
  y: template?.y ?? (from.y + to.y) * .5,
  scale: template?.scale ?? (from.scale + to.scale) * .5,
  rotation: template?.rotation ?? (from.rotation + to.rotation) * .5,
  opacity: template?.opacity ?? (from.opacity + to.opacity) * .5,
  type: 'control',
  handleMode: template?.handleMode ?? 'aligned',
});

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
  const dockIndexes: number[] = [];
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
    dockIndexes.push(dockIndex);
  });

  if (dockIndexes.length !== DOCKING_STOPS.length) return points;
  const firstDockIndex = dockIndexes[0];
  if (firstDockIndex === 0) points.unshift(midpoint(FLIGHT_PATH_START_POINT, points[0]));
  return points;
}

export function normalizeDockingConfig(config: FlightPathConfig): FlightPathConfig {
  return { ...config, points: normalizeDockingPoints(config.points) };
}

export const dockingStopForAnchor = (anchor?: string) => DOCKING_STOPS.find((stop) => stop.anchor === anchor);
