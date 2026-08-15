// The project currently ships three without its optional declaration package.
// @ts-expect-error Runtime ESM exports are present and already used elsewhere.
import { CubicBezierCurve3, CurvePath, Vector3 } from 'three';
import type { FlightPathPoint } from './flightPathTypes';

export type ResolvedFlightPathPoint = FlightPathPoint & {
  scroll: number;
  departureScroll?: number;
};

export type MasterFlightPathControlPoint = {
  sourceIndex: number;
  id: string;
  dockAnchor?: string;
  position: Vector3;
  routeScroll: number;
  rotation: number;
  opacity: number;
};

export type MasterFlightPathSample = {
  position: Vector3;
  tangent: Vector3;
  routeScroll: number;
  rotation: number;
  opacity: number;
  segmentIndex: number;
  curveProgress: number;
};

export type ResolvedBezierHandles = {
  curveIn: { x: number; y: number; z: number };
  curveOut: { x: number; y: number; z: number };
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

/** Resolves legacy nodes and explicit editor handles into one 3D handle model. */
export function resolveBezierHandles(points: FlightPathPoint[], index: number): ResolvedBezierHandles {
  const point = points[index];
  const previous = points[Math.max(0, index - 1)] ?? point;
  const next = points[Math.min(points.length - 1, index + 1)] ?? point;
  const endpointFactor = index === 0 || index === points.length - 1 ? 1 / 3 : 1 / 6;
  const tangent = {
    x: (next.x - previous.x) * endpointFactor,
    y: (next.y - previous.y) * endpointFactor,
    z: (next.scale - previous.scale) * endpointFactor,
  };
  return {
    curveIn: {
      x: point.curveIn?.x ?? -tangent.x,
      y: point.curveIn?.y ?? -tangent.y,
      z: point.curveIn?.z ?? -tangent.z,
    },
    curveOut: {
      x: point.curveOut?.x ?? tangent.x,
      y: point.curveOut?.y ?? tangent.y,
      z: point.curveOut?.z ?? tangent.z,
    },
  };
}

export function createFlightPathControlPoints(points: ResolvedFlightPathPoint[]): MasterFlightPathControlPoint[] {
  return points.map((point, sourceIndex) => ({
    sourceIndex,
    id: point.id,
    dockAnchor: point.dockAnchor,
    position: new Vector3(point.x, point.y, point.scale),
    routeScroll: point.scroll,
    rotation: point.rotation,
    opacity: point.opacity,
  }));
}

/**
 * The sole mathematical model shared by editor rail, docking progress and
 * runtime follower. It owns one global CurvePath and its arc-length cache.
 */
export class FlightPathModel {
  flightPathControlPoints: MasterFlightPathControlPoint[] = [];
  masterFlightPath = new CurvePath();
  pointProgress: number[] = [];
  segmentLengths: number[] = [];
  cumulativeLengths: number[] = [];
  totalLength = 0;

  constructor(points: ResolvedFlightPathPoint[] = []) {
    if (points.length) this.updateFromNodes(points);
  }

  updateFromNodes(points: ResolvedFlightPathPoint[]) {
    this.flightPathControlPoints = createFlightPathControlPoints(points);
    this.masterFlightPath = new CurvePath();
    const handles = points.map((_, index) => resolveBezierHandles(points, index));

    for (let index = 0; index < this.flightPathControlPoints.length - 1; index += 1) {
      const from = this.flightPathControlPoints[index].position;
      const to = this.flightPathControlPoints[index + 1].position;
      const outgoing = handles[index].curveOut;
      const incoming = handles[index + 1].curveIn;
      const segment = new CubicBezierCurve3(
        from.clone(),
        new Vector3(from.x + outgoing.x, from.y + outgoing.y, from.z + outgoing.z),
        new Vector3(to.x + incoming.x, to.y + incoming.y, to.z + incoming.z),
        to.clone(),
      );
      segment.arcLengthDivisions = 160;
      segment.updateArcLengths();
      this.masterFlightPath.add(segment);
    }

    const cumulative = this.masterFlightPath.getCurveLengths() as number[];
    this.cumulativeLengths = [...cumulative];
    this.segmentLengths = cumulative.map((length, index) => length - (cumulative[index - 1] ?? 0));
    this.totalLength = Math.max(cumulative[cumulative.length - 1] ?? 0, 0.000001);
    this.pointProgress = [0, ...cumulative.map((length) => length / this.totalLength)];
    return this;
  }

  getPointAtGlobalProgress(progress: number): Vector3 {
    const point = this.masterFlightPath.getPoint(clamp01(progress));
    return point?.clone() ?? this.flightPathControlPoints[0]?.position.clone() ?? new Vector3();
  }

  getTangentAtGlobalProgress(progress: number): Vector3 {
    const center = clamp01(progress);
    const epsilon = 0.00005;
    const from = this.getPointAtGlobalProgress(Math.max(0, center - epsilon));
    const to = this.getPointAtGlobalProgress(Math.min(1, center + epsilon));
    return to.sub(from).normalize();
  }

  getNodeProgress(sourceIndex: number): number {
    return clamp01(this.pointProgress[sourceIndex] ?? 0);
  }

  getDockProgress(nodeId: string): number {
    let index = this.flightPathControlPoints.findIndex((point) => point.dockAnchor === nodeId);
    if (index < 0) index = this.flightPathControlPoints.findIndex((point) => point.id === nodeId && Boolean(point.dockAnchor));
    if (index < 0) index = this.flightPathControlPoints.findIndex((point) => point.id === nodeId);
    return index < 0 ? 0 : this.getNodeProgress(index);
  }

  getSampleAtGlobalProgress(pathProgress: number): MasterFlightPathSample {
    const progress = clamp01(pathProgress);
    const position = this.getPointAtGlobalProgress(progress);
    let segmentIndex = Math.max(0, this.flightPathControlPoints.length - 2);
    for (let index = 0; index < this.pointProgress.length - 1; index += 1) {
      if (progress <= this.pointProgress[index + 1]) {
        segmentIndex = index;
        break;
      }
    }
    const fromProgress = this.pointProgress[segmentIndex] ?? 0;
    const toProgress = this.pointProgress[segmentIndex + 1] ?? 1;
    const curveProgress = clamp01((progress - fromProgress) / Math.max(toProgress - fromProgress, 0.000001));
    const from = this.flightPathControlPoints[segmentIndex];
    const to = this.flightPathControlPoints[Math.min(segmentIndex + 1, this.flightPathControlPoints.length - 1)];
    return {
      position,
      tangent: this.getTangentAtGlobalProgress(progress),
      routeScroll: mix(from.routeScroll, to.routeScroll, curveProgress),
      rotation: mix(from.rotation, to.rotation, curveProgress),
      opacity: mix(from.opacity, to.opacity, curveProgress),
      segmentIndex,
      curveProgress,
    };
  }
}

export type MasterFlightPath = FlightPathModel;

export function createMasterFlightPath(points: ResolvedFlightPathPoint[]): FlightPathModel {
  return new FlightPathModel(points);
}

export function sampleMasterFlightPath(path: FlightPathModel, pathProgress: number): MasterFlightPathSample {
  return path.getSampleAtGlobalProgress(pathProgress);
}
