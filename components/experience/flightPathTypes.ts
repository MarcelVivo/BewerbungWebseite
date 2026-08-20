export type FlightPathPoint = {
  id: string;
  sectionOffset: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  dockAnchor?: string;
  dockNumber?: string;
  dockLabel?: string;
  dockLocked?: boolean;
  /** Optional DOM-anchored interaction waypoint. Unlike a dock this point is
   *  passed without stopping; reaching it can trigger a matching UI action. */
  touchAnchor?: string;
  touchEvent?: string;
  /** True only on the final docking station, which doubles as the flight path's terminal anchor -
   *  there is no separate, unreachable "end" point after it. Keeps its full docking function. */
  isTerminal?: boolean;
  type?: 'control' | 'dock' | 'start';
  curveIn?: FlightPathCurveHandle;
  curveOut?: FlightPathCurveHandle;
  handleMode?: FlightPathHandleMode;
};

export type FlightPathCurveHandle = {
  x: number;
  y: number;
  z: number;
};

export type FlightPathHandleMode = 'mirrored' | 'aligned' | 'free' | 'corner';

/** Position-only ring config for a docking station, coupled 1:1 with its
 *  dock point's resting position - see flightPathStore.ts's dockRings. */
export type DockRingPosition = { x: number; y: number };

export type FlightPathConfig = {
  followSpeed: number;
  /** The fixed pre-scroll intro anchor. Part of the same draft/undo history as everything else -
   *  never a separate, hardcoded copy edited outside this store. */
  start: FlightPathPoint;
  points: FlightPathPoint[];
  /** Each docking station's visual ring position (section-stage-relative %, matching each
   *  *-dock.json's own convention), keyed by dock anchor id. Updated atomically alongside the
   *  corresponding dock point when a dock anchor is dragged in the editor. */
  dockRings: Record<string, DockRingPosition>;
};
