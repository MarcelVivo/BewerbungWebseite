'use client';

/**
 * Full flight-path editor - Schritt 1: complete point structure and
 * visualization only. No dragging yet (that's Schritt 2). Every anchor and
 * every Bezier handle for the whole route (start, 10 docks, end, and all
 * intermediate anchors) is rendered read-only, colour-coded, and labelled.
 *
 * Architecture invariants (must not be reintroduced/violated):
 * - flightPathStore.ts is the only source of truth for points.
 * - The object and this rail read the exact same FlightPathModel instance
 *   (resolved.masterPath), published by ScrollEntity only.
 * - All coordinate conversions go through flightPathTransforms.ts.
 * - No FLIGHT_PATH_CHANGE_EVENT or other second state channel.
 */

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react';
import {
  getFlightPathDraft,
  getResolvedFlightPath,
  getFlightPathRuntime,
  subscribeFlightPathDraft,
  subscribeResolvedFlightPath,
  subscribeFlightPathRuntime,
} from './flightPathStore';
import { pathSampleToDocument, type Viewport } from './flightPathTransforms';
import { resolveBezierHandles } from './masterFlightPath';
import type { FlightPathPoint } from './flightPathTypes';
import styles from './experience.module.css';

type AnchorKind = 'start' | 'dock' | 'control' | 'end';

type AnchorView = {
  key: string;
  pathRouteIndex: number;
  kind: AnchorKind;
  point: FlightPathPoint;
  documentX: number;
  documentY: number;
  scroll: number;
  curveInDoc: { documentX: number; documentY: number } | null;
  curveOutDoc: { documentX: number; documentY: number } | null;
};

function useEditorEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEnabled(params.get('flight-editor') === '1' || params.get('flightDebug') === '1');
  }, []);
  return enabled;
}

const anchorKindOf = (point: FlightPathPoint): AnchorKind => {
  if (point.dockAnchor) return 'dock';
  if (point.type === 'end') return 'end';
  return 'control';
};

const nodeClassFor = (kind: AnchorKind, isFirst: boolean) => {
  if (kind === 'dock') return `${styles.flightPathNode} ${styles.flightPathDockNode} ${styles.flightPathNodeGold}`;
  if (isFirst) return `${styles.flightPathNode} ${styles.flightPathNodeStart}`;
  if (kind === 'end') return `${styles.flightPathNode} ${styles.flightPathNodeEnd}`;
  return `${styles.flightPathNode} ${styles.flightPathNodeIntermediate}`;
};

export default function FlightPathEditor() {
  const enabled = useEditorEnabled();
  const [documentHeight, setDocumentHeight] = useState(0);

  const draft = useSyncExternalStore(subscribeFlightPathDraft, getFlightPathDraft, getFlightPathDraft);
  const resolved = useSyncExternalStore(subscribeResolvedFlightPath, getResolvedFlightPath, () => null);
  const runtime = useSyncExternalStore(subscribeFlightPathRuntime, getFlightPathRuntime, () => null);

  useEffect(() => {
    if (!enabled) return;
    const updateHeight = () => setDocumentHeight(document.documentElement.scrollHeight);
    updateHeight();
    window.addEventListener('resize', updateHeight);
    // Test-only introspection hook so the store's real state can be verified
    // directly (not inferred from rendered pixel positions). Only ever
    // attached in editor mode.
    (window as unknown as { __flightPathDebug?: unknown }).__flightPathDebug = {
      getDraft: getFlightPathDraft,
      getResolved: getResolvedFlightPath,
      getRuntime: getFlightPathRuntime,
    };
    return () => window.removeEventListener('resize', updateHeight);
  }, [enabled]);

  if (!enabled || !resolved) return null;

  const viewport: Viewport = { width: resolved.viewportWidth, height: resolved.viewportHeight };
  const pathRoute = resolved.pathRoute;

  const anchors: AnchorView[] = pathRoute.map((point, pathRouteIndex) => {
    const handles = resolveBezierHandles(pathRoute, pathRouteIndex);
    const isLast = pathRouteIndex === pathRoute.length - 1;
    return {
      key: `${point.dockAnchor ?? point.type ?? 'control'}-${pathRouteIndex}`,
      pathRouteIndex,
      kind: pathRouteIndex === 0 ? 'start' : anchorKindOf(point),
      point,
      // Already resolved by ScrollEntity's resolveRoute() - the same document
      // position the object itself is placed at, not recomputed here.
      documentX: point.documentX,
      documentY: point.documentY,
      scroll: point.scroll,
      curveInDoc: pathRouteIndex > 0
        ? pathSampleToDocument({ x: point.x + handles.curveIn.x, y: point.y + handles.curveIn.y }, point.scroll, viewport)
        : null,
      curveOutDoc: !isLast
        ? pathSampleToDocument({ x: point.x + handles.curveOut.x, y: point.y + handles.curveOut.y }, point.scroll, viewport)
        : null,
    };
  });

  let hauptankerNumber = 0;

  const distancePxLabel = runtime ? runtime.distancePx.toFixed(3) : '–';
  const distanceOk = runtime ? runtime.distancePx < 1 : true;

  return (
    <div className={styles.flightPathEditor} data-flight-path-editor-root style={{ height: documentHeight || undefined }}>
      <div className={styles.flightPathRailLayer} style={{ height: documentHeight || undefined }}>
        <svg
          className={styles.flightPathRail}
          width="100%"
          height={documentHeight || 1}
          aria-label="Vollständige Flugbahn: Start, alle Docking-Stationen, Ziel - aus der realen Scrollzuordnung abgetastet"
        >
          <path className={styles.flightPathRailShadow} d={resolved.railPath} />
          <path className={styles.flightPathRailLine} data-flight-path-rail-line d={resolved.railPath} />
        </svg>
      </div>

      <div className={styles.flightBezierOverlay} aria-hidden="true">
        <svg>
          {anchors.map((anchor) => (
            <g key={`lines-${anchor.key}`}>
              {anchor.curveInDoc && <line x1={anchor.documentX} y1={anchor.documentY} x2={anchor.curveInDoc.documentX} y2={anchor.curveInDoc.documentY} />}
              {anchor.curveOutDoc && <line x1={anchor.documentX} y1={anchor.documentY} x2={anchor.curveOutDoc.documentX} y2={anchor.curveOutDoc.documentY} />}
            </g>
          ))}
        </svg>
      </div>

      <div className={styles.flightPathNodeLayer}>
        {anchors.map((anchor) => (
          <div key={`handles-${anchor.key}`}>
            {anchor.curveInDoc && (
              <div className={styles.flightBezierHandle} style={{ left: anchor.curveInDoc.documentX, top: anchor.curveInDoc.documentY }} aria-hidden="true">
                <i />
              </div>
            )}
            {anchor.curveOutDoc && (
              <div className={`${styles.flightBezierHandle} ${styles.flightBezierHandleOut}`} style={{ left: anchor.curveOutDoc.documentX, top: anchor.curveOutDoc.documentY }} aria-hidden="true">
                <i />
              </div>
            )}
          </div>
        ))}

        {anchors.map((anchor) => {
          const isMain = anchor.kind !== 'control';
          if (isMain) hauptankerNumber += 1;
          const progress = resolved.masterPath.getNodeProgress(anchor.pathRouteIndex);
          const label = anchor.kind === 'start'
            ? 'START'
            : anchor.kind === 'end'
              ? 'ZIEL'
              : anchor.point.dockLabel ?? `DOCK ${anchor.point.dockNumber ?? ''}`;

          return (
            <div
              key={`node-${anchor.key}`}
              className={nodeClassFor(anchor.kind, anchor.kind === 'start')}
              style={{ left: anchor.documentX, top: anchor.documentY, '--node-depth': 1 } as CSSProperties}
              aria-hidden="true"
            >
              <span className={styles.flightPathNodeDepth} />
              <span className={styles.flightPathNodeCore}>{anchor.kind === 'dock' ? '◇' : anchor.kind === 'control' ? '●' : '★'}</span>
              {isMain && (
                <span className={styles.flightPathNodeLabel}>
                  {label}
                  <small>
                    {String(hauptankerNumber).padStart(2, '0')} · {anchor.point.id}
                    {'\n'}PROGRESS {progress.toFixed(4)} · SCROLL {Math.round(anchor.scroll)}
                  </small>
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.flightPathDebugPanel} data-flight-path-debug>
        {runtime ? (
          <>
            <strong>FLIGHT PATH DEBUG</strong>{'\n'}
            scrollY        {Math.round(runtime.scrollY)}{'\n'}
            path progress  {runtime.currentPathProgress.toFixed(5)}{'\n'}
            segment        {runtime.segmentIndex}{'\n'}
            section        {runtime.activeSectionId}{'\n'}
            station        {runtime.station || '–'}{'\n'}
            phase          {runtime.phaseLabel}{'\n'}
            <span style={{ color: distanceOk ? '#6ee7b7' : '#ff8080' }}>distancePx     {distancePxLabel}</span>{'\n'}
            points         {draft.points.length} (+ start + end)
          </>
        ) : 'wird initialisiert…'}
      </div>
    </div>
  );
}
