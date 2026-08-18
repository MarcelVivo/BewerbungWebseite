/**
 * The one place every coordinate conversion between the flight path's local
 * 0-100 point space, the viewport, and the document lives. ScrollEntity (the
 * real object) and FlightPathEditor (the debug rail/anchor) must both go
 * through these - no component may invent its own percent/pixel math.
 */

export type Viewport = { width: number; height: number };

export type DockViewportTarget = {
  x: number;
  y: number;
  scale: number;
  screenX: number;
  screenY: number;
};

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

/**
 * Converts a rendered docking station into the same viewport-relative path
 * space used by ScrollEntity. Dock rings are authored relative to several
 * different stages (full-screen sticky scenes, the system composer and
 * ordinary section layers), so their saved x/y percentages cannot be used
 * directly as flight-path percentages on every breakpoint.
 *
 * Sticky/fixed ancestors remain at their CSS `top` while a station is active;
 * normal-flow stations are projected to the scroll position at which the
 * flight-path point arrives. This keeps the object centred on the physical
 * ring after any resize, breakpoint change or mobile browser-bar change.
 */
export function resolveDockViewportTarget(
  dockAnchor: string,
  targetScrollY: number,
  viewport: Viewport,
): DockViewportTarget | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  const station = document.querySelector<HTMLElement>(`[data-docking-anchor="${dockAnchor}"]`);
  const stage = station?.parentElement;
  if (!station || !stage) return null;

  const stationRect = station.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  if (stationRect.width <= 0 || stationRect.height <= 0 || stageRect.width <= 0 || stageRect.height <= 0) return null;

  const objectX = Number(station.dataset.dockObjectX ?? 0);
  const objectY = Number(station.dataset.dockObjectY ?? 0);
  const scale = Number(station.dataset.dockScale ?? 1);
  const offsetX = (Number.isFinite(objectX) ? objectX : 0) / 100 * stageRect.width;
  const offsetY = (Number.isFinite(objectY) ? objectY : 0) / 100 * stageRect.height;
  const screenX = stationRect.left + stationRect.width / 2 + offsetX;

  let stickyAncestor: HTMLElement | null = null;
  let ancestor: HTMLElement | null = station.parentElement;
  while (ancestor && ancestor !== document.body) {
    const position = window.getComputedStyle(ancestor).position;
    if (position === 'sticky' || position === 'fixed') {
      stickyAncestor = ancestor;
      break;
    }
    ancestor = ancestor.parentElement;
  }

  let screenY: number;
  if (stickyAncestor) {
    const stickyRect = stickyAncestor.getBoundingClientRect();
    const stickyStyle = window.getComputedStyle(stickyAncestor);
    const authoredTop = Number.parseFloat(stickyStyle.top);
    const stickyTop = stickyStyle.position === 'fixed'
      ? stickyRect.top
      : (Number.isFinite(authoredTop) ? authoredTop : stickyRect.top);
    const stationCenterWithinSticky = stationRect.top + stationRect.height / 2 - stickyRect.top;
    screenY = stickyTop + stationCenterWithinSticky + offsetY;
  } else {
    const stationDocumentCenterY = stationRect.top + window.scrollY + stationRect.height / 2;
    screenY = stationDocumentCenterY - targetScrollY + offsetY;
  }

  const pathPoint = viewportToPathPoint({ left: screenX, top: screenY }, viewport);
  return {
    x: pathPoint.x,
    y: pathPoint.y,
    scale: Number.isFinite(scale) ? scale : 1,
    screenX,
    screenY,
  };
}
