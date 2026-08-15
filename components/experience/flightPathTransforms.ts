/**
 * The one place every coordinate conversion between the flight path's local
 * 0-100 point space, the viewport, and the document lives. ScrollEntity (the
 * real object) and FlightPathEditor (the debug rail/anchor) must both go
 * through these - no component may invent its own percent/pixel math.
 */

export type Viewport = { width: number; height: number };

export function pathPointToViewport(point: { x: number; y: number }, viewport: Viewport) {
  return {
    left: viewport.width * point.x / 100,
    top: viewport.height * point.y / 100,
  };
}

export function viewportToPathPoint(pixel: { left: number; top: number }, viewport: Viewport) {
  return {
    x: pixel.left / Math.max(viewport.width, 1) * 100,
    y: pixel.top / Math.max(viewport.height, 1) * 100,
  };
}

/**
 * A path sample's y is viewport-relative (vh) by design - the object floats
 * at a fixed screen position while the page scrolls under it. To draw that
 * same sample as a point in document space (for a scroll-coupled overlay),
 * add back the scrollY it was sampled at.
 */
export function pathSampleToDocument(position: { x: number; y: number }, scrollYForSample: number, viewport: Viewport) {
  return {
    documentX: viewport.width * position.x / 100,
    documentY: scrollYForSample + viewport.height * position.y / 100,
  };
}

/**
 * Inverse of pathSampleToDocument: a pointer's document-space position,
 * dragged against a point that is anchored at a known scrollY, back into
 * that point's local 0-100 x/y.
 */
export function documentPointerToPathPoint(
  pointerDocumentX: number,
  pointerDocumentY: number,
  resolvedScrollYForPoint: number,
  viewport: Viewport,
) {
  return {
    x: pointerDocumentX / Math.max(viewport.width, 1) * 100,
    y: (pointerDocumentY - resolvedScrollYForPoint) / Math.max(viewport.height, 1) * 100,
  };
}
