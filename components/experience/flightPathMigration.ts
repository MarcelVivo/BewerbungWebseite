/**
 * Pure, dependency-free geometry for splitting a cubic Bezier segment into
 * two exact pieces (De Casteljau's algorithm). Used to migrate the flight
 * path's point structure (e.g. inserting an intermediate anchor into an
 * existing segment) without changing the resulting curve's geometry.
 *
 * Operates on plain {x,y,z} triples - z is the model's "scale" axis, matching
 * masterFlightPath.ts's use of Vector3(point.x, point.y, point.scale).
 */

export type Vec3 = { x: number; y: number; z: number };

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function cubicBezierPoint(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const a = lerpVec3(p0, p1, t);
  const b = lerpVec3(p1, p2, t);
  const c = lerpVec3(p2, p3, t);
  const d = lerpVec3(a, b, t);
  const e = lerpVec3(b, c, t);
  return lerpVec3(d, e, t);
}

/** Sampled approximation, matching the precision class already used by masterFlightPath.ts's arcLengthDivisions. */
export function approximateArcLength(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, divisions = 200): number {
  let length = 0;
  let previous = p0;
  for (let i = 1; i <= divisions; i += 1) {
    const point = cubicBezierPoint(p0, p1, p2, p3, i / divisions);
    length += Math.hypot(point.x - previous.x, point.y - previous.y, point.z - previous.z);
    previous = point;
  }
  return length;
}

export type BezierQuad = [Vec3, Vec3, Vec3, Vec3];

/**
 * Exact subdivision at parameter t (De Casteljau). Concatenating `left` then
 * `right` reproduces the original curve's geometry exactly - this is not an
 * approximation, it's the same construction the curve was already defined
 * by, just re-expressed as two pieces that share one endpoint.
 */
export function subdivideCubicBezier(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): { left: BezierQuad; right: BezierQuad } {
  const p01 = lerpVec3(p0, p1, t);
  const p12 = lerpVec3(p1, p2, t);
  const p23 = lerpVec3(p2, p3, t);
  const p012 = lerpVec3(p01, p12, t);
  const p123 = lerpVec3(p12, p23, t);
  const p0123 = lerpVec3(p012, p123, t);
  return {
    left: [p0, p01, p012, p0123],
    right: [p0123, p123, p23, p3],
  };
}

export type SplitAnchor = {
  position: Vec3;
  rotation: number;
  opacity: number;
  curveIn: Vec3;
  curveOut: Vec3;
};

export type SegmentEndpoint = {
  position: Vec3;
  rotation: number;
  opacity: number;
};

/**
 * Splits the single cubic Bezier segment from anchor `a` to anchor `b` at
 * parameter t, inserting one new anchor. Rotation/opacity at the new anchor
 * are interpolated by arc-length fraction (not raw t), matching how
 * masterFlightPath.ts's getSampleAtGlobalProgress mixes them - so a point
 * sampled anywhere along the resulting two-segment curve gets the exact same
 * rotation/opacity value it would have gotten from the original one-segment
 * curve at the same position.
 */
export function splitSegmentAt(
  a: SegmentEndpoint & { curveOut: Vec3 },
  b: SegmentEndpoint & { curveIn: Vec3 },
  t: number,
): { updatedACurveOut: Vec3; newPoint: SplitAnchor; updatedBCurveIn: Vec3 } {
  const p0 = a.position;
  const p1 = addVec3(p0, a.curveOut);
  const p3 = b.position;
  const p2 = addVec3(p3, b.curveIn);

  const totalLength = approximateArcLength(p0, p1, p2, p3);
  const { left, right } = subdivideCubicBezier(p0, p1, p2, p3, t);
  const splitPosition = left[3];
  const leftLength = approximateArcLength(left[0], left[1], left[2], left[3]);
  const arcFraction = totalLength > 0 ? leftLength / totalLength : t;

  return {
    updatedACurveOut: subVec3(left[1], left[0]),
    newPoint: {
      position: splitPosition,
      rotation: a.rotation + (b.rotation - a.rotation) * arcFraction,
      opacity: a.opacity + (b.opacity - a.opacity) * arcFraction,
      curveIn: subVec3(left[2], splitPosition),
      curveOut: subVec3(right[1], splitPosition),
    },
    updatedBCurveIn: subVec3(right[2], p3),
  };
}
