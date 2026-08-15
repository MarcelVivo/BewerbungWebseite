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
  type?: 'control' | 'dock' | 'start' | 'end';
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

export type FlightPathConfig = {
  followSpeed: number;
  points: FlightPathPoint[];
};

export type FlightPathResolvedPoint = FlightPathPoint & {
  index: number;
  left: number;
  top: number;
  routeScroll: number;
  departureScroll?: number;
};

export type FlightPathResolvedRoute = {
  points: FlightPathResolvedPoint[];
  railPath: string;
};

export type FlightPathRuntimeState = {
  currentPathProgress: number;
  targetPathProgress: number;
  station: string;
  phase: 'transit' | 'hold';
  direction: 'forward' | 'reverse' | 'idle';
  x: number;
  y: number;
  scale: number;
  routeScroll: number;
};

export const FLIGHT_PATH_CHANGE_EVENT = 'flight-path-change';
export const FLIGHT_PATH_RESOLVED_EVENT = 'flight-path-resolved';
export const FLIGHT_PATH_RUNTIME_EVENT = 'flight-path-runtime';
export const FLIGHT_PATH_STORAGE_KEY = 'ms-flight-path-editor-v4-master-curve';
