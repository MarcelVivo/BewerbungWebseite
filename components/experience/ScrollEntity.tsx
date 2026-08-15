'use client';

import { useEffect, useRef, type RefObject } from 'react';
// The project currently ships three without its optional declaration package.
// @ts-expect-error Runtime ESM exports are present and already used elsewhere.
import { Object3D } from 'three';
import flightPath from './flight-path.json';
import FlightPathEditor from './FlightPathEditor';
import TitleDepthLayer from './TitleDepthLayer';
import { FLIGHT_PATH_CHANGE_EVENT, FLIGHT_PATH_RESOLVED_EVENT, FLIGHT_PATH_RUNTIME_EVENT, FLIGHT_PATH_STORAGE_KEY, type FlightPathConfig, type FlightPathPoint, type FlightPathResolvedPoint, type FlightPathResolvedRoute, type FlightPathRuntimeState } from './flightPathTypes';
import { DOCKING_STOPS, FLIGHT_PATH_START_POINT, normalizeDockingPoints } from './dockingRoute';
import { createMasterFlightPath, sampleMasterFlightPath, type MasterFlightPath } from './masterFlightPath';
import {
  DOCK_EPSILON,
  PATH_DAMPING,
  dampPathProgress,
  mapScrollToPathProgress,
  type DockProgressPoint,
  type ScrollPathTarget,
} from './scrollPathController';
import styles from './experience.module.css';

type ScrollEntityProps = {
  rootRef: RefObject<HTMLDivElement | null>;
};

type RoutePoint = FlightPathPoint;

type ResolvedPoint = RoutePoint & {
  scroll: number;
  documentX: number;
  documentY: number;
  departureScroll?: number;
};

type TrailPoint = {
  x: number;
  y: number;
  life: number;
  drift: number;
};

type TrailParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: 'gold' | 'wine';
  phase: number;
};

// Pixel-precise production route captured and approved in the on-page flight-path editor.
const storedPath = flightPath as { followSpeed?: number; points: RoutePoint[] };
const ROUTE: RoutePoint[] = normalizeDockingPoints(storedPath.points);
const INTRO_POSITION = {
  x: FLIGHT_PATH_START_POINT.x,
  y: FLIGHT_PATH_START_POINT.y,
  scale: FLIGHT_PATH_START_POINT.scale,
  rotation: FLIGHT_PATH_START_POINT.rotation,
  opacity: FLIGHT_PATH_START_POINT.opacity,
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

export default function ScrollEntity({ rootRef }: ScrollEntityProps) {
  const entityRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const coreCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackRef = useRef<HTMLImageElement | null>(null);
  const debugRef = useRef<HTMLOutputElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const entity = entityRef.current;
    const canvas = trailRef.current;
    const video = videoRef.current;
    const coreCanvas = coreCanvasRef.current;
    const fallback = fallbackRef.current;
    const debugOutput = debugRef.current;
    const context = canvas?.getContext('2d');
    if (!root || !entity || !canvas || !context || !video || !coreCanvas || !fallback || !debugOutput) return;

    const gl = coreCanvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });

    const compileShader = (type: number, source: string) => {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl?.VERTEX_SHADER ?? 0x8B31, `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `);
    const fragmentShader = compileShader(gl?.FRAGMENT_SHADER ?? 0x8B30, `
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_switchOff;
      varying vec2 v_texCoord;

      float randomBlock(vec2 value) {
        return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        float disruption = smoothstep(0.0, 1.0, u_switchOff);
        float blockCount = mix(720.0, 54.0, disruption);
        vec2 blockIndex = floor(v_texCoord * blockCount);
        vec2 pixelCoord = (blockIndex + 0.5) / blockCount;
        float blockNoise = randomBlock(blockIndex);
        float blockAngle = blockNoise * 6.2831853;
        vec2 randomDirection = vec2(cos(blockAngle), sin(blockAngle));
        vec2 radialDirection = normalize(pixelCoord - 0.5 + vec2(0.0001));
        vec2 explosionDirection = normalize(mix(randomDirection, radialDirection, 0.72));
        float explosionDistance = pow(disruption, 1.45) * (0.025 + blockNoise * 0.15);
        vec2 sourceCoord = pixelCoord - explosionDirection * explosionDistance;
        float insideFrame = step(0.0, sourceCoord.x) * step(sourceCoord.x, 1.0)
          * step(0.0, sourceCoord.y) * step(sourceCoord.y, 1.0);
        vec3 color = texture2D(u_video, clamp(sourceCoord, 0.0, 1.0)).rgb;
        float greenDominance = color.g - max(color.r, color.b);
        float alpha = 1.0 - smoothstep(0.16, 0.48, greenDominance);
        float cleanGreen = min(color.g, max(color.r, color.b) * 1.12 + 0.025);
        vec3 despilled = vec3(color.r, mix(cleanGreen, color.g, alpha), color.b);
        float visibleEdge = smoothstep(0.008, 0.065, alpha);
        float greenResidue = smoothstep(0.008, 0.065, greenDominance);
        float filamentMask = visibleEdge * greenResidue;
        float warmVariation = 0.5 + 0.5 * sin(v_texCoord.x * 31.0 + v_texCoord.y * 53.0);
        float goldWeight = smoothstep(0.38, 0.62, warmVariation + color.r * 0.28);
        vec3 wineRed = vec3(0.56, 0.018, 0.065);
        vec3 warmGold = vec3(0.98, 0.58, 0.075);
        vec3 filamentColor = mix(wineRed, warmGold, goldWeight);
        vec3 finalColor = mix(despilled, filamentColor, filamentMask);
        vec2 blockLocal = fract(v_texCoord * blockCount);
        float blockEdge = min(min(blockLocal.x, 1.0 - blockLocal.x), min(blockLocal.y, 1.0 - blockLocal.y));
        float separatedFragments = mix(1.0, smoothstep(0.035, 0.12, blockEdge), disruption);
        float randomDropout = 1.0 - smoothstep(0.76, 1.0, disruption)
          * (0.22 + step(0.58, blockNoise) * 0.58);
        float finalAlpha = alpha * insideFrame * separatedFragments * randomDropout;
        float energyFlash = sin(disruption * 3.1415926) * 0.22;
        vec3 poweredColor = finalColor * (1.0 + energyFlash)
          + mix(vec3(0.48, 0.018, 0.065), vec3(0.98, 0.58, 0.075), blockNoise)
          * energyFlash * 0.48;
        gl_FragColor = vec4(poweredColor * finalAlpha, finalAlpha);
      }
    `);
    const program = gl?.createProgram() ?? null;
    if (gl && vertexShader && fragmentShader && program) {
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
    }
    const programLinked = Boolean(gl && program && gl.getProgramParameter(program, gl.LINK_STATUS));
    const buffer = programLinked && gl ? gl.createBuffer() : null;
    const texture = programLinked && gl ? gl.createTexture() : null;
    const videoLocation = programLinked && gl && program ? gl.getUniformLocation(program, 'u_video') : null;
    const switchOffLocation = programLinked && gl && program ? gl.getUniformLocation(program, 'u_switchOff') : null;
    const coreRendererAvailable = Boolean(gl && program && buffer && texture && videoLocation && switchOffLocation);
    if (gl && program && buffer && texture && coreRendererAvailable) {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1,
        -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1,
      ]), gl.STATIC_DRAW);
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(videoLocation, 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.clearColor(0, 0, 0, 0);
      gl.viewport(0, 0, coreCanvas.width, coreCanvas.height);
    } else {
      coreCanvas.style.opacity = '0';
      fallback.style.opacity = '1';
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lastHeroPhase = root.dataset.heroPhase ?? 'loading';
    let introIgnitionStartedAt = 0;
    let previousVideoTime = 0;
    let loopReassembly = false;

    const renderCore = () => {
      if (!coreRendererAvailable || !gl || !texture || !switchOffLocation || reducedMotion.matches || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        coreCanvas.style.opacity = '0';
        fallback.style.opacity = '1';
        return;
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      const heroPhase = root.dataset.heroPhase ?? 'revealed';
      if (heroPhase !== lastHeroPhase) {
        if (heroPhase === 'ignition') introIgnitionStartedAt = performance.now();
        if (heroPhase === 'revealed' && lastHeroPhase !== 'revealed') {
          video.currentTime = .32;
          void video.play().catch(() => undefined);
        }
        lastHeroPhase = heroPhase;
      }
      const time = video.currentTime;
      const duration = Number.isFinite(video.duration) && video.duration > 1 ? video.duration : 30.125;
      const pulse = (center: number, radius: number, strength: number) => {
        const distance = Math.abs(time - center);
        return distance < radius ? (1 - distance / radius) * strength : 0;
      };
      if (time + 1 < previousVideoTime) loopReassembly = true;
      if (time >= .3) loopReassembly = false;
      const switchOn = loopReassembly && time < .26 ? 1 - time / .26 : 0;
      const endStart = duration - .38;
      const switchOff = time > endStart ? (time - endStart) / .38 : 0;
      const introElapsed = introIgnitionStartedAt ? performance.now() - introIgnitionStartedAt : 9999;
      const introProgress = Math.min(1, Math.max(0, introElapsed / 820));
      const introDisruption = introElapsed < 820 ? Math.sin(introProgress * Math.PI) * .98 : 0;
      const microInterruptions = Math.max(
        pulse(7.15, .11, .28),
        pulse(15.06, .13, .36),
        pulse(23.05, .11, .26),
      );
      gl.uniform1f(switchOffLocation, Math.min(1, Math.max(switchOn, switchOff, introDisruption, microInterruptions)));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      previousVideoTime = time;
      coreCanvas.style.opacity = '1';
      fallback.style.opacity = '0';
    };

    let frame = 0;
    const urlParameters = new URLSearchParams(window.location.search);
    const flightEditorActive = urlParameters.get('flight-editor') === '1';
    const debugPath = urlParameters.get('debug-path') === '1';
    debugOutput.hidden = !debugPath;
    let editableRoute: RoutePoint[] = ROUTE.map((point) => ({ ...point }));
    let followSpeed = storedPath.followSpeed ?? 1;
    if (flightEditorActive) {
      try {
        const locallyEdited = window.localStorage.getItem(FLIGHT_PATH_STORAGE_KEY);
        if (locallyEdited) {
          const parsed = JSON.parse(locallyEdited) as Partial<FlightPathConfig>;
          if (Array.isArray(parsed.points) && parsed.points.length > 1) {
            editableRoute = normalizeDockingPoints(parsed.points.map((point) => ({ ...point })));
            followSpeed = Number(parsed.followSpeed) || 1;
          }
        }
      } catch {
        // The checked-in route remains the fallback.
      }
    }
    let route: ResolvedPoint[] = [];
    let pathRoute: ResolvedPoint[] = [];
    let masterPath: MasterFlightPath | null = null;
    let dockingProgress: DockProgressPoint[] = [];
    const pathFollower = new Object3D();
    const introPosition = INTRO_POSITION;
    let current = root.dataset.heroPhase === 'loading'
      ? { ...introPosition, opacity: 0 }
      : { x: ROUTE[0].x, y: ROUTE[0].y, scale: ROUTE[0].scale, rotation: ROUTE[0].rotation, opacity: 0 };
    let targetPathProgress = 0;
    let currentPathProgress = 0;
    let pathTarget: ScrollPathTarget = {
      targetPathProgress: 0,
      activeStationIndex: 0,
      activeSectionId: DOCKING_STOPS[0].sectionId,
      sectionProgress: 0,
      transitProgress: 0,
      phase: 'hold',
    };
    let pathInitialized = false;
    let followsRail = root.dataset.heroPhase !== 'loading';
    let previousScrollY = window.scrollY;
    let previousScrollSampleTime = performance.now();
    let scrollVelocity = 0;
    let previousFrameTime = performance.now();
    let lastDebugUpdate = 0;
    let currentRouteScroll = 0;
    let previousCenter = { x: window.innerWidth * current.x / 100, y: window.innerHeight * current.y / 100 };
    let flightDirection = { x: -.82, y: -.28 };
    let emission = 0;
    const strands: TrailPoint[][] = Array.from({ length: 5 }, () => []);
    const particles: TrailParticle[] = [];

    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const resolveRoute = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      route = editableRoute.map((point) => {
        const section = document.getElementById(point.id);
        if (!section) return {
          ...point,
          scroll: 0,
          documentX: viewportWidth * point.x / 100,
          documentY: viewportHeight * point.y / 100,
        };
        const rect = section.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top;
        const scroll = absoluteTop + rect.height * point.sectionOffset - viewportHeight * .5;
        // Keep the route's virtual tail beyond the browser's physical maximum
        // scroll. Otherwise all contact points collapse onto one value and the
        // final docking node becomes ambiguous.
        const resolvedScroll = Math.max(0, scroll);
        return {
          ...point,
          scroll: resolvedScroll,
          documentX: viewportWidth * point.x / 100,
          documentY: resolvedScroll + viewportHeight * point.y / 100,
        };
      });
      const dockIndexes = route.flatMap((point, index) => point.dockAnchor ? [index] : []);
      const main = document.getElementById('main-content');
      const mainRect = main?.getBoundingClientRect();
      const maximumScroll = Math.max(0, (mainRect ? window.scrollY + mainRect.bottom : document.documentElement.scrollHeight) - viewportHeight);
      dockIndexes.forEach((routeIndex, dockOrder) => {
        if (dockOrder > 0) {
          const previousDock = route[dockIndexes[dockOrder - 1]];
          const minimumArrival = (previousDock.departureScroll ?? previousDock.scroll) + viewportHeight * .48;
          if (route[routeIndex].scroll < minimumArrival) {
            route[routeIndex] = {
              ...route[routeIndex],
              scroll: minimumArrival,
              documentY: minimumArrival + viewportHeight * route[routeIndex].y / 100,
            };
          }
        }
        const nextStop = DOCKING_STOPS[dockOrder + 1];
        const nextSection = nextStop ? document.getElementById(nextStop.sectionId) : null;
        const nextSectionTop = nextSection ? window.scrollY + nextSection.getBoundingClientRect().top : maximumScroll;
        route[routeIndex] = {
          ...route[routeIndex],
          departureScroll: nextStop
            ? Math.max(route[routeIndex].scroll, nextSectionTop - viewportHeight)
            : maximumScroll,
        };
      });
      const firstDockIndex = dockIndexes[0] ?? -1;
      if (firstDockIndex > 0) {
        const firstDockScroll = route[firstDockIndex].scroll;
        for (let index = 0; index < firstDockIndex; index += 1) {
          const scroll = firstDockScroll * (index + 1) / (firstDockIndex + 1);
          route[index] = {
            ...route[index],
            scroll,
            documentY: scroll + viewportHeight * route[index].y / 100,
          };
        }
      }
      dockIndexes.slice(0, -1).forEach((fromIndex, dockOrder) => {
        const toIndex = dockIndexes[dockOrder + 1];
        const fromScroll = route[fromIndex].departureScroll ?? route[fromIndex].scroll;
        const toScroll = route[toIndex].scroll;
        for (let index = fromIndex + 1; index < toIndex; index += 1) {
          const amount = (index - fromIndex) / (toIndex - fromIndex);
          const scroll = mix(fromScroll, toScroll, amount);
          route[index] = {
            ...route[index],
            scroll,
            documentY: scroll + viewportHeight * route[index].y / 100,
          };
        }
      });

      pathRoute = [{
        ...FLIGHT_PATH_START_POINT,
        scroll: 0,
        documentX: viewportWidth * FLIGHT_PATH_START_POINT.x / 100,
        documentY: viewportHeight * FLIGHT_PATH_START_POINT.y / 100,
      }, ...route];
      const resolvedMasterPath = masterPath ?? createMasterFlightPath(pathRoute);
      if (masterPath) resolvedMasterPath.updateFromNodes(pathRoute);
      masterPath = resolvedMasterPath;
      dockingProgress = DOCKING_STOPS.flatMap((stop) => {
        const pointIndex = route.findIndex((point) => point.dockAnchor === stop.anchor);
        const pathProgress = resolvedMasterPath.getNodeProgress(pointIndex + 1);
        const routePoint = route[pointIndex];
        if (pointIndex < 0 || !routePoint || !Number.isFinite(pathProgress)) return [];
        const isLast = DOCKING_STOPS.indexOf(stop) === DOCKING_STOPS.length - 1;
        return [{
          sectionId: stop.sectionId,
          pathProgress,
          arrivalScroll: routePoint.scroll,
          // The follower remains docked until the next scene actually begins
          // rising into the viewport. This is a distance zone, never a count of
          // wheel or touch events.
          departureScroll: isLast ? Number.POSITIVE_INFINITY : routePoint.departureScroll ?? routePoint.scroll,
        }];
      });
      if (debugPath) debugOutput.dataset.docks = JSON.stringify(dockingProgress);

      if (flightEditorActive) {
        const resolvedGeometry: FlightPathResolvedPoint[] = route.map((point, index) => ({
          ...point,
          index,
          left: point.documentX,
          top: point.documentY,
          routeScroll: point.scroll,
          departureScroll: point.departureScroll,
        }));
        const sampleCount = Math.max(420, resolvedMasterPath.flightPathControlPoints.length * 56);
        const railCommands: string[] = [];
        for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
          const sample = sampleMasterFlightPath(resolvedMasterPath, sampleIndex / sampleCount);
          const left = viewportWidth * sample.position.x / 100;
          const top = sample.routeScroll + viewportHeight * sample.position.y / 100;
          railCommands.push(`${sampleIndex === 0 ? 'M' : 'L'} ${left.toFixed(1)} ${top.toFixed(1)}`);
        }
        window.dispatchEvent(new CustomEvent<FlightPathResolvedRoute>(FLIGHT_PATH_RESOLVED_EVENT, {
          detail: { points: resolvedGeometry, railPath: railCommands.join(' ') },
        }));
      }
    };

    const positionOnRail = (pathProgress: number) => {
      if (!masterPath) return { ...introPosition };
      const sample = sampleMasterFlightPath(masterPath, pathProgress);
      currentRouteScroll = sample.routeScroll;
      // This is the sole runtime writer of the carrier's world position.
      pathFollower.position.copy(sample.position);
      entity.dataset.pathSegment = String(sample.segmentIndex);
      entity.dataset.pathCurveProgress = sample.curveProgress.toFixed(6);
      return {
        x: pathFollower.position.x,
        y: pathFollower.position.y,
        scale: clamp(pathFollower.position.z, .1, 2),
        rotation: clamp(sample.rotation, -6, 6),
        opacity: sample.opacity,
      };
    };

    const resolveTarget = () => {
      if (!route.length || !masterPath) resolveRoute();
      const scroll = window.scrollY;
      const viewportHeight = Math.max(window.innerHeight, 1);
      pathTarget = mapScrollToPathProgress(scroll, viewportHeight, dockingProgress);
      targetPathProgress = pathTarget.targetPathProgress;
      followsRail = (root.dataset.heroPhase ?? 'loading') !== 'loading' || scroll >= window.innerHeight * .1;

      if (!pathInitialized) {
        currentPathProgress = targetPathProgress;
        pathInitialized = true;
        current = followsRail ? positionOnRail(currentPathProgress) : { ...introPosition };
      }

      DOCKING_STOPS.forEach((stop, stationIndex) => {
        const section = document.getElementById(stop.sectionId);
        if (!section) return;
        const isActive = pathTarget.phase === 'hold' && stationIndex === pathTarget.activeStationIndex;
        const engaged = isActive ? 1 : 0;
        section.style.setProperty(`--${stop.anchor}-dock-engaged`, engaged.toFixed(4));
        section.style.setProperty(`--${stop.anchor}-dock-charge`, engaged.toFixed(4));
      });
    };

    const renderTrail = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const center = { x: width * current.x / 100, y: height * current.y / 100 };
      const velocity = { x: center.x - previousCenter.x, y: center.y - previousCenter.y };
      const speed = Math.hypot(velocity.x, velocity.y);

      if (speed > .15) {
        const normalized = { x: velocity.x / speed, y: velocity.y / speed };
        flightDirection.x = mix(flightDirection.x, normalized.x, .17);
        flightDirection.y = mix(flightDirection.y, normalized.y, .17);
        const directionLength = Math.max(.001, Math.hypot(flightDirection.x, flightDirection.y));
        flightDirection.x /= directionLength;
        flightDirection.y /= directionLength;
      }

      previousCenter = center;
      context.clearRect(0, 0, width, height);
      if (reducedMotion.matches || current.opacity < .015) return;

      const perpendicular = { x: -flightDirection.y, y: flightDirection.x };
      const bodyRadius = Math.min(width * .105, 120) * current.scale;
      const wake = clamp(speed / 11, 0, 1);

      strands.forEach((strand, index) => {
        const lateral = (index - 2) * bodyRadius * .19;
        const origin = {
          x: center.x - flightDirection.x * bodyRadius * .45 + perpendicular.x * lateral,
          y: center.y - flightDirection.y * bodyRadius * .45 + perpendicular.y * lateral,
        };

        strand.unshift({ x: origin.x, y: origin.y, life: 1, drift: (index - 2) * .018 });
        if (strand.length > 34) strand.pop();

        strand.forEach((point, pointIndex) => {
          if (pointIndex === 0) return;
          const age = pointIndex / strand.length;
          const curl = Math.sin(pointIndex * .52 + index * 1.7 + performance.now() * .0012);
          point.x -= flightDirection.x * (.18 + wake * .55) + perpendicular.x * point.drift;
          point.y -= flightDirection.y * (.18 + wake * .55) + perpendicular.y * point.drift + curl * .018;
          point.life = Math.max(0, 1 - age);
        });

        for (let pointIndex = 1; pointIndex < strand.length; pointIndex += 1) {
          const from = strand[pointIndex - 1];
          const to = strand[pointIndex];
          const alpha = Math.pow(to.life, 1.7) * (.13 + wake * .22) * current.opacity;
          if (alpha <= .002) continue;
          context.beginPath();
          context.moveTo(from.x, from.y);
          context.quadraticCurveTo(
            mix(from.x, to.x, .5) + perpendicular.x * Math.sin(pointIndex * .7 + index) * 1.8,
            mix(from.y, to.y, .5) + perpendicular.y * Math.sin(pointIndex * .7 + index) * 1.8,
            to.x,
            to.y,
          );
          context.strokeStyle = index % 2 === 0
            ? `rgba(235, 198, 103, ${alpha})`
            : `rgba(132, 30, 47, ${alpha * .92})`;
          context.lineWidth = Math.max(.28, (1.05 - pointIndex * .022) * current.scale);
          context.stroke();
        }
      });

      emission += .18 + wake * 2.15;
      while (emission >= 1 && particles.length < 120) {
        emission -= 1;
        const lateral = (Math.random() - .5) * bodyRadius * 1.15;
        const gold = Math.random() > .38;
        const maxLife = 54 + Math.random() * 72;
        particles.push({
          x: center.x - flightDirection.x * bodyRadius * (.28 + Math.random() * .34) + perpendicular.x * lateral,
          y: center.y - flightDirection.y * bodyRadius * (.28 + Math.random() * .34) + perpendicular.y * lateral,
          vx: -flightDirection.x * (.22 + Math.random() * (.42 + wake * 1.1)) + perpendicular.x * (Math.random() - .5) * .38,
          vy: -flightDirection.y * (.22 + Math.random() * (.42 + wake * 1.1)) + perpendicular.y * (Math.random() - .5) * .38 - .035,
          life: maxLife,
          maxLife,
          size: (gold ? .45 : .38) + Math.random() * (gold ? 1.05 : .82),
          color: gold ? 'gold' : 'wine',
          phase: Math.random() * Math.PI * 2,
        });
      }

      context.globalCompositeOperation = 'lighter';
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.life -= 1;
        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }

        const age = 1 - particle.life / particle.maxLife;
        const dissolve = Math.pow(1 - age, 1.75) * current.opacity;
        particle.vx *= .989;
        particle.vy = particle.vy * .989 - .0025;
        particle.x += particle.vx + Math.sin(particle.phase + age * 8) * .035;
        particle.y += particle.vy + Math.cos(particle.phase + age * 7) * .025;

        context.beginPath();
        context.arc(particle.x, particle.y, Math.max(.22, particle.size * (1 - age * .52)), 0, Math.PI * 2);
        context.fillStyle = particle.color === 'gold'
          ? `rgba(240, 203, 108, ${dissolve * .72})`
          : `rgba(151, 36, 54, ${dissolve * .62})`;
        context.shadowBlur = particle.color === 'gold' ? 5 : 3;
        context.shadowColor = particle.color === 'gold' ? 'rgba(231,197,106,.65)' : 'rgba(121,22,41,.58)';
        context.fill();
      }
      context.shadowBlur = 0;
      context.globalCompositeOperation = 'source-over';
    };

    const render = (now: number) => {
      const deltaTime = clamp((now - previousFrameTime) / 1000, 1 / 240, 1 / 30);
      previousFrameTime = now;
      scrollVelocity *= Math.exp(-deltaTime * 5.2);
      const responseRate = PATH_DAMPING * clamp(followSpeed, .25, 2.5)
        + clamp(scrollVelocity / 260, 0, 7);
      currentPathProgress = reducedMotion.matches
        ? targetPathProgress
        : dampPathProgress(currentPathProgress, targetPathProgress, deltaTime, responseRate);

      const dockProgress = dockingProgress[pathTarget.activeStationIndex]?.pathProgress;
      const docked = pathTarget.phase === 'hold'
        && Number.isFinite(dockProgress)
        && Math.abs(currentPathProgress - dockProgress) <= DOCK_EPSILON;
      if (docked) currentPathProgress = dockProgress;

      if (followsRail) {
        // The complete carrier position comes from the one master curve.
        current = positionOnRail(currentPathProgress);
      } else {
        current = { ...introPosition, opacity: root.dataset.heroPhase === 'loading' ? 0 : introPosition.opacity };
      }

      const activeStop = DOCKING_STOPS[pathTarget.activeStationIndex];
      if (docked && activeStop) {
        entity.dataset.docking = 'true';
        entity.dataset.dockStation = activeStop.anchor;
        root.dataset.dockStation = activeStop.anchor;
      } else {
        entity.dataset.docking = pathTarget.phase === 'transit' ? 'approach' : 'false';
        delete entity.dataset.dockStation;
        delete root.dataset.dockStation;
      }
      root.dataset.dockPhase = pathTarget.phase;

      if (flightEditorActive) {
        const progressDelta = targetPathProgress - currentPathProgress;
        const runtimeState: FlightPathRuntimeState = {
          currentPathProgress,
          targetPathProgress,
          station: activeStop?.number ?? '',
          phase: pathTarget.phase,
          direction: Math.abs(progressDelta) < .00008 ? 'idle' : progressDelta > 0 ? 'forward' : 'reverse',
          x: current.x,
          y: current.y,
          scale: current.scale,
          routeScroll: currentRouteScroll,
        };
        window.dispatchEvent(new CustomEvent<FlightPathRuntimeState>(FLIGHT_PATH_RUNTIME_EVENT, { detail: runtimeState }));
      }

      if (debugPath && now - lastDebugUpdate > 90) {
        lastDebugUpdate = now;
        debugOutput.value = [
          `SECTION  ${pathTarget.activeSectionId || '–'}`,
          `SECTION PROGRESS  ${pathTarget.sectionProgress.toFixed(4)}`,
          `TRANSIT PROGRESS  ${pathTarget.transitProgress.toFixed(4)}`,
          `TARGET PATH  ${targetPathProgress.toFixed(5)}`,
          `CURRENT PATH  ${currentPathProgress.toFixed(5)}`,
          `STATION  ${activeStop?.number ?? '–'}`,
          `DOCKED  ${String(docked)}`,
        ].join('\n');
      }
      if (debugPath) {
        entity.dataset.targetPathProgress = targetPathProgress.toFixed(6);
        entity.dataset.currentPathProgress = currentPathProgress.toFixed(6);
        entity.dataset.activeStation = activeStop?.anchor ?? '';
        entity.dataset.pathPhase = pathTarget.phase;
      }

      entity.style.left = `${current.x.toFixed(3)}vw`;
      entity.style.top = `${current.y.toFixed(3)}vh`;
      entity.style.transform = `translate3d(-50%, -50%, 0) rotate(${current.rotation.toFixed(3)}deg) scale(${current.scale.toFixed(4)})`;
      entity.style.opacity = current.opacity.toFixed(3);
      renderCore();
      renderTrail();

      if (reducedMotion.matches) frame = 0;
      else frame = window.requestAnimationFrame(render);
    };

    const requestRender = () => {
      resolveTarget();
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const handleScroll = () => {
      const scrollDelta = Math.abs(window.scrollY - previousScrollY);
      const now = performance.now();
      const elapsed = Math.max(8, now - previousScrollSampleTime);
      const sampledVelocity = scrollDelta / elapsed * 1000;
      scrollVelocity = mix(scrollVelocity, sampledVelocity, .34);
      previousScrollY = window.scrollY;
      previousScrollSampleTime = now;
      requestRender();
    };

    const heroPhaseObserver = new MutationObserver(requestRender);
    heroPhaseObserver.observe(root, { attributes: true, attributeFilter: ['data-hero-phase'] });

    const handleResize = () => {
      resizeCanvas();
      resolveRoute();
      requestRender();
    };

    const handleDockCalibration = () => {
      resolveRoute();
      requestRender();
    };

    const handleFlightPathChange = (event: Event) => {
      const detail = (event as CustomEvent<FlightPathConfig>).detail;
      if (!detail || !Array.isArray(detail.points) || detail.points.length < 2) return;
      editableRoute = normalizeDockingPoints(detail.points.map((point) => ({ ...point })));
      followSpeed = detail.followSpeed ?? 1;
      resolveRoute();
      requestRender();
    };

    const handleMotionPreference = () => {
      if (video) {
        if (reducedMotion.matches) video.pause();
        else void video.play().catch(() => undefined);
      }
      requestRender();
    };

    resizeCanvas();
    resolveRoute();
    resolveTarget();
    handleMotionPreference();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('load', handleResize);
    window.addEventListener('dock-calibration-change', handleDockCalibration);
    window.addEventListener(FLIGHT_PATH_CHANGE_EVENT, handleFlightPathChange);
    reducedMotion.addEventListener('change', handleMotionPreference);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      video.pause();
      if (gl && texture) gl.deleteTexture(texture);
      if (gl && buffer) gl.deleteBuffer(buffer);
      if (gl && program) gl.deleteProgram(program);
      if (gl && vertexShader) gl.deleteShader(vertexShader);
      if (gl && fragmentShader) gl.deleteShader(fragmentShader);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('load', handleResize);
      window.removeEventListener('dock-calibration-change', handleDockCalibration);
      window.removeEventListener(FLIGHT_PATH_CHANGE_EVENT, handleFlightPathChange);
      reducedMotion.removeEventListener('change', handleMotionPreference);
      heroPhaseObserver.disconnect();
    };
  }, [rootRef]);

  return (
    <>
      <canvas ref={trailRef} className={styles.scrollEntityTrail} aria-hidden="true" />
      <div
        ref={entityRef}
        className={styles.scrollEntity}
        data-scroll-path-follower
        style={{
          left: `${INTRO_POSITION.x}vw`,
          top: `${INTRO_POSITION.y}vh`,
          opacity: INTRO_POSITION.opacity,
          transform: `translate3d(-50%, -50%, 0) rotate(${INTRO_POSITION.rotation}deg) scale(${INTRO_POSITION.scale})`,
        }}
      >
        <video
          ref={videoRef}
          className={styles.scrollEntitySource}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="auto"
        >
          <source src="/cinematic/object/synthetic-intelligence-organism-v2-pingpong-chroma.mp4" type="video/mp4" />
        </video>
        <img
          ref={fallbackRef}
          className={`${styles.scrollEntityCore} ${styles.scrollEntityFallback}`}
          src="/cinematic/object/synthetic-intelligence-organism-v2-transparent-v2.png"
          alt=""
          draggable="false"
        />
        <canvas ref={coreCanvasRef} className={styles.scrollEntityVideo} width="704" height="540" />
      </div>
      <output ref={debugRef} className={styles.scrollPathDebug} hidden aria-live="off" />
      <TitleDepthLayer />
      <FlightPathEditor />
    </>
  );
}
