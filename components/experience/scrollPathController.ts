export type ScrollPathPhase = 'transit' | 'hold';

export type ScrollPathTarget = {
  targetPathProgress: number;
  activeStationIndex: number;
  activeSectionId: string;
  sectionProgress: number;
  transitProgress: number;
  phase: ScrollPathPhase;
};

export type DockProgressPoint = {
  sectionId: string;
  pathProgress: number;
  arrivalScroll: number;
  departureScroll: number;
};

export const PATH_DAMPING = 15;
export const DOCK_EPSILON = 0.00065;
export const MIN_TRANSIT_VIEWPORTS = 0.48;

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

export function dampPathProgress(current: number, target: number, deltaTime: number, response = PATH_DAMPING) {
  const safeDelta = Math.min(0.05, Math.max(0, Number.isFinite(deltaTime) ? deltaTime : 0));
  const safeResponse = Math.max(0.01, Number.isFinite(response) ? response : PATH_DAMPING);
  return clamp01(current + (clamp01(target) - clamp01(current)) * (1 - Math.exp(-safeResponse * safeDelta)));
}

/**
 * Scroll only selects progress on the immutable master curve. Hold zones keep
 * that scalar exactly at a dock; they never add points, loops or rail length.
 */
export function mapScrollToPathProgress(
  scrollY: number,
  viewportHeight: number,
  docks: DockProgressPoint[],
): ScrollPathTarget {
  if (docks.length === 0) {
    return { targetPathProgress: 0, activeStationIndex: 0, activeSectionId: '', sectionProgress: 0, transitProgress: 0, phase: 'hold' };
  }

  const scroll = Math.max(0, Number.isFinite(scrollY) ? scrollY : 0);
  const first = docks[0];
  if (first.arrivalScroll > 0 && scroll < first.arrivalScroll) {
    const transitProgress = clamp01(scroll / first.arrivalScroll);
    return {
      targetPathProgress: mix(0, first.pathProgress, transitProgress),
      activeStationIndex: 0,
      activeSectionId: first.sectionId,
      sectionProgress: transitProgress,
      transitProgress,
      phase: 'transit',
    };
  }

  if (docks.length === 1 || scroll <= first.departureScroll) {
    return {
      targetPathProgress: clamp01(first.pathProgress),
      activeStationIndex: 0,
      activeSectionId: first.sectionId,
      sectionProgress: first.departureScroll > 0 ? clamp01(scroll / first.departureScroll) : 1,
      transitProgress: 0,
      phase: 'hold',
    };
  }

  for (let stationIndex = 0; stationIndex < docks.length - 1; stationIndex += 1) {
    const from = docks[stationIndex];
    const to = docks[stationIndex + 1];
    const departure = from.departureScroll;
    const arrival = Math.max(departure + Math.max(1, viewportHeight * MIN_TRANSIT_VIEWPORTS), to.arrivalScroll);

    if (scroll < arrival) {
      const transitProgress = clamp01((scroll - departure) / Math.max(arrival - departure, 1));
      return {
        targetPathProgress: mix(from.pathProgress, to.pathProgress, transitProgress),
        activeStationIndex: stationIndex + 1,
        activeSectionId: to.sectionId,
        sectionProgress: transitProgress,
        transitProgress,
        phase: 'transit',
      };
    }

    if (stationIndex === docks.length - 2 || scroll <= to.departureScroll) {
      return {
        targetPathProgress: clamp01(to.pathProgress),
        activeStationIndex: stationIndex + 1,
        activeSectionId: to.sectionId,
        sectionProgress: to.departureScroll > arrival ? clamp01((scroll - arrival) / (to.departureScroll - arrival)) : 1,
        transitProgress: 1,
        phase: 'hold',
      };
    }
  }

  const last = docks[docks.length - 1];
  return {
    targetPathProgress: clamp01(last.pathProgress),
    activeStationIndex: docks.length - 1,
    activeSectionId: last.sectionId,
    sectionProgress: 1,
    transitProgress: 1,
    phase: 'hold',
  };
}
