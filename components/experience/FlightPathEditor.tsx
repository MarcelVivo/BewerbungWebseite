'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
// The project ships the Three.js runtime without its optional declaration package.
// @ts-expect-error Runtime ESM exports are available and used for editor ray casting.
import { OrthographicCamera, Plane, Raycaster, Vector2, Vector3 } from 'three';
import flightPath from './flight-path.json';
import {
  FLIGHT_PATH_CHANGE_EVENT,
  FLIGHT_PATH_RESOLVED_EVENT,
  FLIGHT_PATH_RUNTIME_EVENT,
  FLIGHT_PATH_STORAGE_KEY,
  type FlightPathConfig,
  type FlightPathCurveHandle,
  type FlightPathHandleMode,
  type FlightPathPoint,
  type FlightPathResolvedRoute,
  type FlightPathRuntimeState,
} from './flightPathTypes';
import { DOCKING_STOPS, FLIGHT_PATH_START_POINT, dockingStopForAnchor, normalizeDockingConfig, resolveDockPlacement } from './dockingRoute';
import { resolveBezierHandles } from './masterFlightPath';
import { useDraggableCalibrationPanel } from './useDraggableCalibrationPanel';
import styles from './experience.module.css';

type GeometryPoint = FlightPathPoint & {
  index: number;
  left: number;
  top: number;
  routeScroll: number;
  departureScroll?: number;
};

type ViewportSize = { width: number; height: number };
type DragAxis = 'view' | 'x' | 'y' | 'z';
type PointDrag = {
  pointerId: number;
  pointIndex: number;
  routeScroll: number;
  axis: DragAxis;
  depth: number;
  startHitY: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  startScale: number;
  before: FlightPathConfig;
};
type BezierHandleKind = 'curveIn' | 'curveOut';
type BezierDrag = {
  pointerId: number;
  pointIndex: number;
  kind: BezierHandleKind;
  startClientX: number;
  startClientY: number;
  startVector: FlightPathCurveHandle;
  oppositeVector: FlightPathCurveHandle;
  oppositeLength: number;
  handleMode: FlightPathHandleMode;
  viewportWidth: number;
  viewportHeight: number;
  before: FlightPathConfig;
};

const storedPath = flightPath as { followSpeed?: number; points: FlightPathPoint[] };
const PANEL_COLLAPSED_KEY = 'ms-flight-path-panel-collapsed-v2';
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const rounded = (value: number, digits = 4) => Number(value.toFixed(digits));
const cloneConfig = (config: FlightPathConfig): FlightPathConfig => ({
  followSpeed: config.followSpeed,
  points: config.points.map((point) => ({
    ...point,
    curveIn: point.curveIn ? { ...point.curveIn } : undefined,
    curveOut: point.curveOut ? { ...point.curveOut } : undefined,
  })),
});
const configsMatch = (left: FlightPathConfig, right: FlightPathConfig) => JSON.stringify(left) === JSON.stringify(right);
const depthForScale = (scale: number) => (scale - .75) * 240;

const INITIAL_CONFIG: FlightPathConfig = normalizeDockingConfig({
  followSpeed: storedPath.followSpeed ?? 1,
  points: storedPath.points.map((point) => ({ ...point })),
});

const materializeBezierHandles = (config: FlightPathConfig): FlightPathConfig => {
  const pathPoints = [FLIGHT_PATH_START_POINT, ...config.points];
  return {
    ...config,
    points: config.points.map((point, index) => {
      const handles = resolveBezierHandles(pathPoints, index + 1);
      return {
        ...point,
        type: point.dockAnchor ? 'dock' : 'control',
        handleMode: point.handleMode ?? 'aligned',
        curveIn: { x: rounded(handles.curveIn.x), y: rounded(handles.curveIn.y), z: rounded(handles.curveIn.z) },
        curveOut: { x: rounded(handles.curveOut.x), y: rounded(handles.curveOut.y), z: rounded(handles.curveOut.z) },
      };
    }),
  };
};

export default function FlightPathEditor() {
  const [enabled, setEnabled] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [config, setConfig] = useState<FlightPathConfig>(INITIAL_CONFIG);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [axis, setAxis] = useState<DragAxis>('view');
  const [geometry, setGeometry] = useState<GeometryPoint[]>([]);
  const [railPath, setRailPath] = useState('');
  const [pageHeight, setPageHeight] = useState(1);
  const [viewport, setViewport] = useState<ViewportSize>({ width: 1, height: 1 });
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'loading' | 'error'>('idle');
  const [historyVersion, setHistoryVersion] = useState(0);
  const panel = useDraggableCalibrationPanel('ms-flight-path-panel-v2');
  const configRef = useRef<FlightPathConfig>(cloneConfig(INITIAL_CONFIG));
  const axisRef = useRef<DragAxis>('view');
  const pointDragRef = useRef<PointDrag | null>(null);
  const bezierDragRef = useRef<BezierDrag | null>(null);
  const historyRef = useRef<FlightPathConfig[]>([cloneConfig(INITIAL_CONFIG)]);
  const historyIndexRef = useRef(0);
  const raycasterRef = useRef(new Raycaster());
  const pointerRef = useRef(new Vector2());
  const cameraRef = useRef(new OrthographicCamera(0, 1, 0, -1, .1, 2000));
  const planeRef = useRef(new Plane(new Vector3(0, 0, 1), 0));
  const hitRef = useRef(new Vector3());
  const railSceneRef = useRef<HTMLDivElement | null>(null);
  const nodeLayerRef = useRef<HTMLDivElement | null>(null);
  const runtimeMarkerRef = useRef<HTMLDivElement | null>(null);
  const runtimeReadoutRef = useRef<HTMLOutputElement | null>(null);

  const setCurrentConfig = useCallback((next: FlightPathConfig) => {
    const copied = cloneConfig(next);
    configRef.current = copied;
    setConfig(copied);
  }, []);

  const resetHistory = useCallback((next: FlightPathConfig) => {
    historyRef.current = [cloneConfig(next)];
    historyIndexRef.current = 0;
    setHistoryVersion((version) => version + 1);
  }, []);

  const pushHistory = useCallback((next: FlightPathConfig) => {
    const snapshot = cloneConfig(next);
    const current = historyRef.current[historyIndexRef.current];
    if (current && configsMatch(current, snapshot)) return;
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    if (historyRef.current.length > 80) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
    setHistoryVersion((version) => version + 1);
  }, []);

  const commitConfig = useCallback((next: FlightPathConfig, recordHistory = true) => {
    setCurrentConfig(next);
    if (recordHistory) pushHistory(next);
    setStatus('dirty');
  }, [pushHistory, setCurrentConfig]);

  const alignDocks = useCallback((current: FlightPathConfig) => ({
    ...current,
    points: current.points.map((point) => {
      const stop = dockingStopForAnchor(point.dockAnchor);
      const placement = stop ? resolveDockPlacement(stop) : null;
      if (!stop || !placement) return point;
      return {
        ...point,
        id: stop.sectionId,
        x: rounded(placement.x),
        y: rounded(placement.y),
        scale: placement.scale,
        dockAnchor: stop.anchor,
        dockNumber: stop.number,
        dockLabel: stop.label,
        dockLocked: true,
      };
    }),
  }), []);

  const configureRayCamera = useCallback(() => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    const camera = cameraRef.current;
    camera.left = 0;
    camera.right = width;
    camera.top = 0;
    camera.bottom = -height;
    camera.near = .1;
    camera.far = 2000;
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    return { width, height, camera };
  }, []);

  const raycastPointerToDepthPlane = useCallback((clientX: number, clientY: number, depth: number) => {
    const { width, height, camera } = configureRayCamera();
    pointerRef.current.set(clientX / width * 2 - 1, -(clientY / height) * 2 + 1);
    raycasterRef.current.setFromCamera(pointerRef.current, camera);
    planeRef.current.set(new Vector3(0, 0, 1), -depth);
    return raycasterRef.current.ray.intersectPlane(planeRef.current, hitRef.current)
      ? hitRef.current.clone()
      : null;
  }, [configureRayCamera]);

  useEffect(() => { axisRef.current = axis; }, [axis]);

  useEffect(() => {
    const active = new URLSearchParams(window.location.search).get('flight-editor') === '1';
    setEnabled(active);
    if (!active) return;
    document.documentElement.style.scrollBehavior = 'auto';
    const experienceRoot = document.querySelector<HTMLElement>('.experience-root');
    if (experienceRoot) experienceRoot.dataset.flightEditor = 'true';
    let next = materializeBezierHandles(alignDocks(cloneConfig(INITIAL_CONFIG)));
    try {
      setPanelCollapsed(window.localStorage.getItem(PANEL_COLLAPSED_KEY) === 'true');
      const local = window.localStorage.getItem(FLIGHT_PATH_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local) as Partial<FlightPathConfig>;
        if (Array.isArray(parsed.points) && parsed.points.length >= 4) {
          next = materializeBezierHandles(alignDocks(normalizeDockingConfig({
            followSpeed: Number(parsed.followSpeed) || 1,
            points: parsed.points.map((point) => ({ ...point })),
          })));
        }
      }
    } catch {
      next = materializeBezierHandles(alignDocks(cloneConfig(INITIAL_CONFIG)));
    }
    setCurrentConfig(next);
    resetHistory(next);
    return () => {
      document.documentElement.style.removeProperty('scroll-behavior');
      delete document.documentElement.dataset.flightDragging;
      if (experienceRoot) delete experienceRoot.dataset.flightEditor;
    };
  }, [alignDocks, resetHistory, setCurrentConfig]);

  const setPanelVisibility = (collapsed: boolean) => {
    setPanelCollapsed(collapsed);
    try { window.localStorage.setItem(PANEL_COLLAPSED_KEY, String(collapsed)); } catch { /* The toggle still works for this visit. */ }
  };

  const resolveFallbackGeometry = useCallback(() => {
    if (!enabled) return;
    const viewportHeight = Math.max(window.innerHeight, 1);
    const viewportWidth = Math.max(window.innerWidth, 1);
    const next = configRef.current.points.map<GeometryPoint>((point, index) => {
      const stop = dockingStopForAnchor(point.dockAnchor);
      const placement = stop ? resolveDockPlacement(stop) : null;
      if (placement) {
        return {
          ...point,
          x: placement.x,
          y: placement.y,
          scale: placement.scale,
          index,
          left: viewportWidth * placement.x / 100,
          top: placement.routeScroll + viewportHeight * placement.y / 100,
          routeScroll: placement.routeScroll,
          dockLocked: true,
        };
      }
      const section = document.getElementById(point.id);
      const rect = section?.getBoundingClientRect();
      const sectionTop = rect ? window.scrollY + rect.top : 0;
      const routeScroll = Math.max(0, sectionTop + (rect?.height ?? viewportHeight) * point.sectionOffset - viewportHeight * .5);
      return {
        ...point,
        index,
        left: viewportWidth * point.x / 100,
        top: routeScroll + viewportHeight * point.y / 100,
        routeScroll,
      };
    });
    setGeometry(next);
    setViewport({ width: viewportWidth, height: viewportHeight });
    setPageHeight(Math.max(document.documentElement.scrollHeight, ...next.map((point) => point.top + viewportHeight)));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const syncResolvedRoute = (event: Event) => {
      const detail = (event as CustomEvent<FlightPathResolvedRoute>).detail;
      if (!detail || !Array.isArray(detail.points) || detail.points.length < 2) return;
      const next = detail.points.map<GeometryPoint>((point) => ({ ...point }));
      setGeometry(next);
      setRailPath(detail.railPath);
      setViewport({ width: Math.max(window.innerWidth, 1), height: Math.max(window.innerHeight, 1) });
      setPageHeight(Math.max(document.documentElement.scrollHeight, ...next.map((point) => point.top + window.innerHeight)));
    };
    const syncRuntime = (event: Event) => {
      const detail = (event as CustomEvent<FlightPathRuntimeState>).detail;
      if (!detail) return;
      /* The rail is a fixed template drawn once (compressed to fit the
         viewport via verticalScale on railSceneRef) and never re-translated
         on scroll — it must not move at all. Only the live PathFollower
         marker below moves, driven purely by scroll-derived pathProgress. */
      if (runtimeMarkerRef.current) {
        runtimeMarkerRef.current.style.left = `${detail.x.toFixed(3)}vw`;
        runtimeMarkerRef.current.style.top = `${detail.y.toFixed(3)}vh`;
        runtimeMarkerRef.current.style.setProperty('--marker-depth', detail.scale.toFixed(3));
      }
      if (runtimeReadoutRef.current) {
        runtimeReadoutRef.current.value = [
          `PATH ${detail.currentPathProgress.toFixed(4)}  →  ${detail.targetPathProgress.toFixed(4)}`,
          `STATION ${detail.station || '–'}  ·  STATE ${detail.phase.toUpperCase()}`,
          `DIRECTION ${detail.direction.toUpperCase()}`,
        ].join('\n');
      }
    };
    const handleResize = () => resolveFallbackGeometry();
    const handleDockCalibration = () => {
      const next = alignDocks(configRef.current);
      setCurrentConfig(next);
      resolveFallbackGeometry();
    };
    window.addEventListener(FLIGHT_PATH_RESOLVED_EVENT, syncResolvedRoute);
    window.addEventListener(FLIGHT_PATH_RUNTIME_EVENT, syncRuntime);
    window.addEventListener('resize', handleResize);
    window.addEventListener('dock-calibration-change', handleDockCalibration);
    resolveFallbackGeometry();
    return () => {
      window.removeEventListener(FLIGHT_PATH_RESOLVED_EVENT, syncResolvedRoute);
      window.removeEventListener(FLIGHT_PATH_RUNTIME_EVENT, syncRuntime);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('dock-calibration-change', handleDockCalibration);
    };
  }, [alignDocks, enabled, resolveFallbackGeometry, setCurrentConfig]);

  useEffect(() => {
    if (!enabled) return;
    window.dispatchEvent(new CustomEvent<FlightPathConfig>(FLIGHT_PATH_CHANGE_EVENT, { detail: config }));
    try { window.localStorage.setItem(FLIGHT_PATH_STORAGE_KEY, JSON.stringify(config)); } catch { /* Preview remains live. */ }
  }, [config, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const move = (event: PointerEvent) => {
      const bezierDrag = bezierDragRef.current;
      if (bezierDrag && event.pointerId === bezierDrag.pointerId) {
        event.preventDefault();
        const deltaX = (event.clientX - bezierDrag.startClientX) / bezierDrag.viewportWidth * 100;
        const deltaY = (event.clientY - bezierDrag.startClientY) / bezierDrag.viewportHeight * 100;
        let x = bezierDrag.startVector.x;
        let y = bezierDrag.startVector.y;
        let z = bezierDrag.startVector.z;
        if (axisRef.current === 'view' || axisRef.current === 'x') x += deltaX;
        if (axisRef.current === 'view' || axisRef.current === 'y') y += deltaY;
        if (axisRef.current === 'z') z -= deltaY * .02;
        if (event.shiftKey && axisRef.current === 'view') {
          const length = Math.hypot(x, y);
          const constrainedAngle = Math.round(Math.atan2(y, x) / (Math.PI / 4)) * (Math.PI / 4);
          x = Math.cos(constrainedAngle) * length;
          y = Math.sin(constrainedAngle) * length;
        }
        x = rounded(clamp(x, -150, 150));
        y = rounded(clamp(y, -150, 150));
        z = rounded(clamp(z, -2, 2));
        const oppositeKind: BezierHandleKind = bezierDrag.kind === 'curveIn' ? 'curveOut' : 'curveIn';
        let opposite = { ...bezierDrag.oppositeVector };
        let handleMode = bezierDrag.handleMode;
        const temporarilyFree = event.altKey && (handleMode === 'mirrored' || handleMode === 'aligned');
        if (temporarilyFree) {
          handleMode = 'free';
        } else if (handleMode === 'mirrored') {
          opposite = { x: rounded(-x), y: rounded(-y), z: rounded(-z) };
        } else if (handleMode === 'aligned') {
          const length = Math.hypot(x, y, z);
          if (length > .0001 && bezierDrag.oppositeLength > .0001) {
            opposite = {
              x: rounded(-x / length * bezierDrag.oppositeLength),
              y: rounded(-y / length * bezierDrag.oppositeLength),
              z: rounded(-z / length * bezierDrag.oppositeLength),
            };
          }
        }
        const current = configRef.current;
        const next = {
          ...current,
          points: current.points.map((point, index) => index === bezierDrag.pointIndex
            ? { ...point, handleMode, [bezierDrag.kind]: { x, y, z }, [oppositeKind]: opposite }
            : point),
        };
        setCurrentConfig(next);
        setStatus('dirty');
        return;
      }
      const drag = pointDragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      event.preventDefault();
      const hit = raycastPointerToDepthPlane(event.clientX, event.clientY, drag.depth);
      if (!hit) return;
      const viewportWidth = Math.max(window.innerWidth, 1);
      const viewportHeight = Math.max(window.innerHeight, 1);
      let x = drag.startX;
      let y = drag.startY;
      let scale = drag.startScale;
      if (drag.axis === 'view' || drag.axis === 'x') {
        x = clamp((hit.x + drag.offsetX) / viewportWidth * 100, 2, 98);
      }
      if (drag.axis === 'view' || drag.axis === 'y') {
        /* Y is dragged relative to the drag start, at natural (uncompressed)
           sensitivity: one viewport height of real mouse travel covers the
           full local 0..100% range, regardless of how compressed the rail
           is drawn. Routing this through the document-scale conversion used
           for display made every pixel of mouse movement swing the value by
           editorHeight/viewportHeight percent — instantly pinned the range. */
        y = clamp(drag.startY - (hit.y - drag.startHitY) / viewportHeight * 100, 2, 98);
      }
      if (drag.axis === 'z') {
        scale = clamp(drag.startScale + (hit.y - drag.startHitY) / viewportHeight * 1.5, .1, 2);
      }
      const current = configRef.current;
      const next = {
        ...current,
        points: current.points.map((point, index) => index === drag.pointIndex
          ? { ...point, x: rounded(x), y: rounded(y), scale: rounded(scale) }
          : point),
      };
      setCurrentConfig(next);
      setStatus('dirty');
    };
    const finish = (event: PointerEvent) => {
      const bezierDrag = bezierDragRef.current;
      if (bezierDrag && bezierDrag.pointerId === event.pointerId) {
        bezierDragRef.current = null;
        delete document.documentElement.dataset.flightDragging;
        if (!configsMatch(bezierDrag.before, configRef.current)) pushHistory(configRef.current);
        return;
      }
      const drag = pointDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      pointDragRef.current = null;
      delete document.documentElement.dataset.flightDragging;
      if (!configsMatch(drag.before, configRef.current)) pushHistory(configRef.current);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [enabled, pushHistory, raycastPointerToDepthPlane, setCurrentConfig]);

  const startPointDrag = (event: ReactPointerEvent<HTMLButtonElement>, point: GeometryPoint) => {
    setSelectedIndex(point.index);
    if (event.button !== 0 || point.dockLocked) return;
    const depth = depthForScale(point.scale);
    const hit = raycastPointerToDepthPlane(event.clientX, event.clientY, depth);
    if (!hit) return;
    event.preventDefault();
    event.stopPropagation();
    pointDragRef.current = {
      pointerId: event.pointerId,
      pointIndex: point.index,
      routeScroll: point.routeScroll,
      axis: axisRef.current,
      depth,
      startHitY: hit.y,
      offsetX: point.left - hit.x,
      offsetY: 0,
      startX: point.x,
      startY: point.y,
      startScale: point.scale,
      before: cloneConfig(configRef.current),
    };
    document.documentElement.dataset.flightDragging = 'true';
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* Synthetic test events do not own pointer capture. */ }
  };

  const startBezierDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    pointIndex: number,
    kind: BezierHandleKind,
    vector: FlightPathCurveHandle,
    oppositeVector: FlightPathCurveHandle,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedIndex(pointIndex);
    bezierDragRef.current = {
      pointerId: event.pointerId,
      pointIndex,
      kind,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startVector: { ...vector },
      oppositeVector: { ...oppositeVector },
      oppositeLength: Math.hypot(oppositeVector.x, oppositeVector.y, oppositeVector.z),
      handleMode: configRef.current.points[pointIndex]?.handleMode ?? 'aligned',
      viewportWidth: Math.max(window.innerWidth, 1),
      viewportHeight: Math.max(window.innerHeight, 1),
      before: cloneConfig(configRef.current),
    };
    document.documentElement.dataset.flightDragging = 'true';
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* Synthetic test events do not own pointer capture. */ }
  };

  const updateSelected = useCallback((patch: Partial<FlightPathPoint>) => {
    const current = configRef.current;
    const selected = current.points[selectedIndex];
    if (!selected || selected.dockLocked) return;
    const next = {
      ...current,
      points: current.points.map((point, index) => index === selectedIndex ? { ...point, ...patch } : point),
    };
    commitConfig(next);
  }, [commitConfig, selectedIndex]);

  const updateNumber = (key: keyof FlightPathPoint) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;
    updateSelected({ [key]: value });
  };

  const addPointAfterSelected = useCallback(() => {
    const current = configRef.current;
    if (current.points.length >= 100 || selectedIndex >= current.points.length - 1) return;
    const from = current.points[selectedIndex];
    const to = current.points[selectedIndex + 1];
    const inserted: FlightPathPoint = {
      id: to.id,
      sectionOffset: rounded((from.sectionOffset + to.sectionOffset) * .5, 8),
      x: rounded((from.x + to.x) * .5),
      y: rounded((from.y + to.y) * .5),
      scale: rounded((from.scale + to.scale) * .5),
      rotation: rounded((from.rotation + to.rotation) * .5),
      opacity: rounded((from.opacity + to.opacity) * .5),
      type: 'control',
      handleMode: 'aligned',
    };
    const points = [...current.points];
    points.splice(selectedIndex + 1, 0, inserted);
    const next = materializeBezierHandles({ ...current, points });
    commitConfig(next);
    setSelectedIndex(selectedIndex + 1);
  }, [commitConfig, selectedIndex]);

  const removeSelected = useCallback(() => {
    const current = configRef.current;
    const selected = current.points[selectedIndex];
    if (!selected || selected.dockAnchor || current.points.length <= 4) return;
    const points = current.points.filter((_, index) => index !== selectedIndex);
    commitConfig({ ...current, points });
    setSelectedIndex(Math.min(selectedIndex, points.length - 1));
  }, [commitConfig, selectedIndex]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setCurrentConfig(historyRef.current[historyIndexRef.current]);
    setSelectedIndex((index) => Math.min(index, historyRef.current[historyIndexRef.current].points.length - 1));
    setStatus('dirty');
    setHistoryVersion((version) => version + 1);
  }, [setCurrentConfig]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setCurrentConfig(historyRef.current[historyIndexRef.current]);
    setSelectedIndex((index) => Math.min(index, historyRef.current[historyIndexRef.current].points.length - 1));
    setStatus('dirty');
    setHistoryVersion((version) => version + 1);
  }, [setCurrentConfig]);

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editingField = target?.matches('input, textarea, select, [contenteditable="true"]');
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if (editingField) return;
      const key = event.key.toLowerCase();
      if (key === 'x' || key === 'y' || key === 'z') {
        setAxis(key);
        return;
      }
      if (key === 'v' || key === 'escape') {
        setAxis('view');
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        removeSelected();
        return;
      }
      const selected = configRef.current.points[selectedIndex];
      if (!selected || selected.dockLocked || !event.key.startsWith('Arrow')) return;
      event.preventDefault();
      const step = event.shiftKey ? .1 : .5;
      if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        updateSelected({ scale: rounded(clamp(selected.scale + (event.key === 'ArrowUp' ? .01 : -.01), .1, 2)) });
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        updateSelected({ x: rounded(clamp(selected.x + (event.key === 'ArrowRight' ? step : -step), 2, 98)) });
      } else {
        updateSelected({ y: rounded(clamp(selected.y + (event.key === 'ArrowDown' ? step : -step), 2, 98)) });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, redo, removeSelected, selectedIndex, undo, updateSelected]);

  const save = async () => {
    setStatus('saving');
    try {
      const savedConfig = materializeBezierHandles(configRef.current);
      setCurrentConfig(savedConfig);
      const response = await fetch('/api/flight-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedConfig),
      });
      if (!response.ok) throw new Error('save failed');
      setStatus('saved');
      window.setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setStatus('error');
    }
  };

  const loadSaved = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/flight-path', { cache: 'no-store' });
      if (!response.ok) throw new Error('load failed');
      const loaded = await response.json() as FlightPathConfig;
      if (!Array.isArray(loaded.points) || loaded.points.length < 4) throw new Error('invalid path');
      const next = materializeBezierHandles(alignDocks(normalizeDockingConfig(loaded)));
      setCurrentConfig(next);
      resetHistory(next);
      setSelectedIndex(0);
      setStatus('saved');
      window.setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setStatus('error');
    }
  };

  const selected = config.points[selectedIndex] ?? config.points[0];
  const editorHeight = useMemo(() => Math.max(pageHeight, ...geometry.map((point) => point.top + viewport.height)), [geometry, pageHeight, viewport.height]);
  const verticalScale = useMemo(() => viewport.height / Math.max(editorHeight, 1), [editorHeight, viewport.height]);
  const dockingPointByIndex = useMemo(() => {
    const mapped = new Map<number, (typeof DOCKING_STOPS)[number]>();
    geometry.forEach((point) => {
      const stop = dockingStopForAnchor(point.dockAnchor);
      if (stop) mapped.set(point.index, stop);
    });
    return mapped;
  }, [geometry]);
  const controlNumberByIndex = useMemo(() => {
    const mapped = new Map<number, number>();
    let number = 0;
    config.points.forEach((point, index) => {
      if (point.dockAnchor) return;
      number += 1;
      mapped.set(index, number);
    });
    return mapped;
  }, [config.points]);
  const handlePathPoints = useMemo<FlightPathPoint[]>(() => [
    FLIGHT_PATH_START_POINT,
    ...geometry.map((point) => ({
      ...point,
      curveIn: config.points[point.index]?.curveIn,
      curveOut: config.points[point.index]?.curveOut,
      handleMode: config.points[point.index]?.handleMode,
    })),
  ], [config.points, geometry]);
  const selectedGeometry = geometry.find((point) => point.index === selectedIndex);
  const selectedHandles = selectedGeometry
    ? resolveBezierHandles(handlePathPoints, selectedIndex + 1)
    : null;
  const setSelectedHandleMode = (mode: FlightPathHandleMode) => {
    if (!selectedHandles) return;
    const current = configRef.current;
    const selectedPoint = current.points[selectedIndex];
    if (!selectedPoint) return;
    let curveIn: FlightPathCurveHandle = { x: selectedHandles.curveIn.x, y: selectedHandles.curveIn.y, z: selectedHandles.curveIn.z };
    let curveOut: FlightPathCurveHandle = { x: selectedHandles.curveOut.x, y: selectedHandles.curveOut.y, z: selectedHandles.curveOut.z };
    if (mode === 'corner') {
      curveIn = { x: 0, y: 0, z: 0 };
      curveOut = { x: 0, y: 0, z: 0 };
    } else if (mode === 'mirrored') {
      curveIn = { x: rounded(-curveOut.x), y: rounded(-curveOut.y), z: rounded(-curveOut.z) };
    } else if (mode === 'aligned') {
      const outgoingLength = Math.max(Math.hypot(curveOut.x, curveOut.y, curveOut.z), .0001);
      const incomingLength = Math.hypot(curveIn.x, curveIn.y, curveIn.z);
      curveIn = {
        x: rounded(-curveOut.x / outgoingLength * incomingLength),
        y: rounded(-curveOut.y / outgoingLength * incomingLength),
        z: rounded(-curveOut.z / outgoingLength * incomingLength),
      };
    }
    commitConfig({
      ...current,
      points: current.points.map((point, index) => index === selectedIndex
        ? { ...point, handleMode: mode, curveIn, curveOut }
        : point),
    });
  };
  const updateSelectedHandleZ = (kind: BezierHandleKind) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = clamp(Number(event.target.value), -2, 2);
    if (!Number.isFinite(value)) return;
    const current = configRef.current;
    const point = current.points[selectedIndex];
    const handles = selectedHandles;
    if (!point || !handles) return;
    const existing = kind === 'curveIn' ? handles.curveIn : handles.curveOut;
    commitConfig({
      ...current,
      points: current.points.map((candidate, index) => index === selectedIndex
        ? { ...candidate, [kind]: { x: existing.x, y: existing.y, z: rounded(value) } }
        : candidate),
    });
  };
  const selectedDock = dockingPointByIndex.get(selectedIndex);
  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;
  void historyVersion;
  if (!enabled || !selected) return null;

  return (
    <div className={styles.flightPathEditor} style={{ height: editorHeight }} data-flight-path-editor data-editor-mode="overview" data-drag-axis={axis}>
      <div ref={railSceneRef} className={styles.flightPathRailLayer} style={{ height: editorHeight, transform: `scaleY(${verticalScale})`, transformOrigin: 'top left' }}>
        <svg className={styles.flightPathRail} width="100%" height={editorHeight} aria-label="Eine globale, durchgehende Flugschiene">
          <defs>
            <filter id="flight-rail-glow" x="-60%" y="-10%" width="220%" height="120%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <path className={styles.flightPathRailShadow} d={railPath} />
          <path className={styles.flightPathRailLine} d={railPath} filter="url(#flight-rail-glow)" />
          <path className={styles.flightPathRailPulse} d={railPath} />
        </svg>
      </div>

      <div ref={runtimeMarkerRef} className={styles.flightPathProgressMarker} aria-hidden="true"><i /></div>
      <output ref={runtimeReadoutRef} className={styles.flightPathRuntimeReadout}>PATH 0.0000{`\n`}STATION 01 · STATE HOLD{`\n`}DIRECTION IDLE</output>

      <div ref={nodeLayerRef} className={styles.flightPathNodeLayer}>
      {selectedGeometry && selectedHandles && (
        <div className={styles.flightBezierOverlay} aria-label="Bézier-Kurvengriffe des ausgewählten Punkts">
          <svg aria-hidden="true">
            <line
              x1={selectedGeometry.left}
              y1={selectedGeometry.top * verticalScale}
              x2={selectedGeometry.left + viewport.width * selectedHandles.curveIn.x / 100}
              y2={(selectedGeometry.top + viewport.height * selectedHandles.curveIn.y / 100) * verticalScale}
            />
            {selectedIndex < geometry.length - 1 && <line
              x1={selectedGeometry.left}
              y1={selectedGeometry.top * verticalScale}
              x2={selectedGeometry.left + viewport.width * selectedHandles.curveOut.x / 100}
              y2={(selectedGeometry.top + viewport.height * selectedHandles.curveOut.y / 100) * verticalScale}
            />}
          </svg>
          <button
            type="button"
            className={styles.flightBezierHandle}
            style={{
              left: selectedGeometry.left + viewport.width * selectedHandles.curveIn.x / 100,
              top: (selectedGeometry.top + viewport.height * selectedHandles.curveIn.y / 100) * verticalScale,
            }}
            onPointerDown={(event) => startBezierDrag(event, selectedIndex, 'curveIn', selectedHandles.curveIn, selectedHandles.curveOut)}
            aria-label="Eingehenden Bézier-Kurvengriff ziehen"
          ><i /><span>IN</span></button>
          {selectedIndex < geometry.length - 1 && <button
            type="button"
            className={`${styles.flightBezierHandle} ${styles.flightBezierHandleOut}`}
            style={{
              left: selectedGeometry.left + viewport.width * selectedHandles.curveOut.x / 100,
              top: (selectedGeometry.top + viewport.height * selectedHandles.curveOut.y / 100) * verticalScale,
            }}
            onPointerDown={(event) => startBezierDrag(event, selectedIndex, 'curveOut', selectedHandles.curveOut, selectedHandles.curveIn)}
            aria-label="Ausgehenden Bézier-Kurvengriff ziehen"
          ><i /><span>OUT</span></button>}
        </div>
      )}
      <div
        className={`${styles.flightPathNode} ${styles.flightPathStartNode}`}
        style={{
          left: viewport.width * FLIGHT_PATH_START_POINT.x / 100,
          top: viewport.height * FLIGHT_PATH_START_POINT.y / 100 * verticalScale,
          '--node-depth': FLIGHT_PATH_START_POINT.scale,
        } as CSSProperties}
        aria-label="Fester Startpunkt der Master-Curve"
      >
        <span className={styles.flightPathNodeDepth} />
        <span className={styles.flightPathNodeCore}>S</span>
        <span className={styles.flightPathNodeLabel}>OBJEKT-START<small>FEST · MASTER-CURVE BEGINN</small></span>
      </div>

      {geometry.map((point) => {
        const dock = dockingPointByIndex.get(point.index);
        const controlNumber = controlNumberByIndex.get(point.index);
        const controlName = `CONTROL ${String(controlNumber ?? point.index + 1).padStart(2, '0')}`;
        return (
          <button
            type="button"
            key={`${point.dockAnchor ?? point.id}-${point.index}`}
            className={`${styles.flightPathNode} ${dock ? styles.flightPathDockNode : ''} ${point.dockLocked ? styles.flightPathDockNodeLocked : ''} ${point.index === selectedIndex ? styles.flightPathNodeSelected : ''}`}
            style={{ left: point.left, top: point.top * verticalScale, '--node-depth': clamp(point.scale, .25, 1.4) } as CSSProperties}
            onPointerDown={(event) => startPointDrag(event, point)}
            onClick={() => setSelectedIndex(point.index)}
            aria-label={dock ? `Gesperrter Master-Curve-Anker für Station ${dock.number}` : `${controlName} in 3D verschieben`}
            data-dock-rail-point={dock ? 'true' : undefined}
            data-dock-anchor={dock?.anchor}
            data-dock-locked={point.dockLocked ? 'true' : 'false'}
          >
            <span className={styles.flightPathNodeDepth} />
            <span className={styles.flightPathNodeCore}>{dock ? '◇' : '●'}</span>
            <span className={styles.flightPathNodeLabel}>
              {dock ? `DOCK ${dock.number} · ${dock.label}` : controlName}
              <small>{dock ? 'LOCKED · MASTER-CURVE' : `${axis.toUpperCase()}-DRAG · X ${point.x.toFixed(1)} · Y ${point.y.toFixed(1)} · Z ${point.scale.toFixed(2)}`}</small>
            </span>
          </button>
        );
      })}
      </div>

      {panelCollapsed ? (
        <button type="button" className={styles.flightPathPanelRestore} onClick={() => setPanelVisibility(false)}>FLUGBAHN-REGLER EINBLENDEN</button>
      ) : (
        <aside ref={panel.panelRef} style={panel.panelStyle} className={styles.flightPathPanel}>
          <header onPointerDown={panel.startDrag}>
            <div><strong>3D MASTER-FLUGBAHN</strong><span>1 BÉZIER-KURVE · WYSIWYG</span></div>
            <div className={styles.flightPathPanelHeaderActions}>
              <i>{String(selectedIndex + 1).padStart(2, '0')} / {String(config.points.length).padStart(2, '0')}</i>
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setPanelVisibility(true)}>AUSBLENDEN</button>
            </div>
          </header>
          <p className={styles.flightPathHint}><b>DIREKT BEARBEITEN:</b> Goldene Punkte mit dem Cursor greifen. IN/OUT formen die Kurve wie in Illustrator; Alt löst, Shift rastet bei 45° ein. Cyanfarbene Rauten bleiben gesperrt.</p>
          <div className={styles.flightPathAxisModes} aria-label="Drag-Achse wählen">
            {([
              ['view', 'FREI', 'V'],
              ['x', 'X', 'X'],
              ['y', 'Y', 'Y'],
              ['z', 'Z / TIEFE', 'Z'],
            ] as const).map(([mode, label, shortcut]) => (
              <button type="button" key={mode} data-active={axis === mode} onClick={() => setAxis(mode)}>{label}<small>{shortcut}</small></button>
            ))}
          </div>
          <div className={styles.flightPathSelected}><span>{selectedDock ? 'DOCKING-ANCHOR · LOCKED' : `CONTROL ${String(controlNumberByIndex.get(selectedIndex) ?? 0).padStart(2, '0')}`}</span><strong>{selectedDock ? `STATION ${selectedDock.number}` : selected.id}</strong></div>
          <div className={styles.flightPathCoordinateInputs}>
            <label><span>X</span><input type="number" min="2" max="98" step=".1" value={rounded(selected.x, 2)} disabled={Boolean(selectedDock)} onChange={updateNumber('x')} /></label>
            <label><span>Y</span><input type="number" min="2" max="98" step=".1" value={rounded(selected.y, 2)} disabled={Boolean(selectedDock)} onChange={updateNumber('y')} /></label>
            <label><span>Z</span><input type="number" min=".1" max="2" step=".01" value={rounded(selected.scale, 3)} disabled={Boolean(selectedDock)} onChange={updateNumber('scale')} /></label>
          </div>
          <div className={styles.flightPathBezierMode} aria-label="Bézier-Handle-Modus">
            {(['mirrored', 'aligned', 'free', 'corner'] as const).map((mode) => (
              <button type="button" key={mode} data-active={(selected.handleMode ?? 'aligned') === mode} onClick={() => setSelectedHandleMode(mode)}>{mode.toUpperCase()}</button>
            ))}
          </div>
          {selectedHandles && <div className={styles.flightPathCoordinateInputs}>
            <label><span>IN Z</span><input type="number" min="-2" max="2" step=".01" value={rounded(selectedHandles.curveIn.z, 3)} onChange={updateSelectedHandleZ('curveIn')} /></label>
            <label><span>OUT Z</span><input type="number" min="-2" max="2" step=".01" value={rounded(selectedHandles.curveOut.z, 3)} onChange={updateSelectedHandleZ('curveOut')} /></label>
          </div>}
          {!selectedDock && <div className={styles.flightPathTwoColumns}>
            <label><span>ROTATION <b>{selected.rotation.toFixed(0)}°</b></span><input type="range" min="-90" max="90" step="1" value={selected.rotation} onChange={updateNumber('rotation')} /></label>
            <label><span>TIEFE / Z <b>{selected.scale.toFixed(2)}</b></span><input type="range" min=".1" max="2" step=".01" value={selected.scale} onChange={updateNumber('scale')} /></label>
          </div>}
          <p className={styles.flightPathKeyHint}>X / Y / Z = Achse · V = frei · Shift + Pfeile = fein · Alt + ↑/↓ = Tiefe</p>
          <label className={styles.flightPathSpeed}><span>NACHLAUF / REAKTION <b>{config.followSpeed.toFixed(2)}×</b></span><input type="range" min=".25" max="2.5" step=".05" value={config.followSpeed} onChange={(event) => commitConfig({ ...configRef.current, followSpeed: Number(event.target.value) })} /></label>
          <div className={styles.flightPathPointActions}>
            <button type="button" onClick={addPointAfterSelected} disabled={selectedIndex >= config.points.length - 1 || config.points.length >= 100}>POINT DANACH +</button>
            <button type="button" onClick={removeSelected} disabled={Boolean(selectedDock) || config.points.length <= 4}>POINT LÖSCHEN</button>
            <button type="button" onClick={undo} disabled={!canUndo}>UNDO</button>
            <button type="button" onClick={redo} disabled={!canRedo}>REDO</button>
          </div>
          <div className={styles.flightPathActions}>
            <button type="button" onClick={loadSaved} disabled={status === 'loading' || status === 'saving'}>{status === 'loading' ? 'LÄDT…' : 'GESPEICHERTEN STAND LADEN'}</button>
            <button type="button" data-primary onClick={save} disabled={status === 'saving' || status === 'loading'}>{status === 'saving' ? 'SPEICHERT…' : status === 'saved' ? 'GESPEICHERT ✓' : status === 'error' ? 'FEHLER' : 'FLUGBAHN SPEICHERN'}</button>
          </div>
          <footer><span>Nur sichtbar mit <code>?flight-editor=1</code>.</span><button type="button" onClick={() => { const url = new URL(window.location.href); url.searchParams.delete('flight-editor'); window.location.href = url.toString(); }}>EDITOR SCHLIESSEN</button></footer>
        </aside>
      )}
    </div>
  );
}
