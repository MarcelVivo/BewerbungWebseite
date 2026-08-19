'use client';

import { useEffect, useRef, type RefObject } from 'react';
// The project currently ships three without its optional declaration package.
// @ts-expect-error Runtime ESM exports are present and already used elsewhere.
import { Object3D } from 'three';
import FlightPathEditor from './FlightPathEditor';
import TitleDepthLayer from './TitleDepthLayer';
import {
  getFlightPathDraft,
  setFlightPathRuntime,
  setResolvedFlightPath,
  subscribeFlightPathDraft,
  type FlightPathRuntimeState,
  type ResolvedFlightPathPoint,
} from './flightPathStore';
import { measureVisibleDockViewportTarget, pathSampleToDocument, resolveDockViewportTarget } from './flightPathTransforms';
import { DOCKING_STOPS, dockingStopForAnchor } from './dockingRoute';
import { createMasterFlightPath, sampleMasterFlightPath, type MasterFlightPath } from './masterFlightPath';
import {
  DOCK_EPSILON,
  MIN_TRANSIT_VIEWPORTS,
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

type ResolvedPoint = ResolvedFlightPathPoint;

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

// Always read live from the shared draft - the pre-scroll intro visual must
// reflect a dragged start point exactly like the rail and the object's
// on-scroll movement do. Never a snapshot copied once at module load.
const getIntroPosition = () => {
  const start = getFlightPathDraft().start;
  return { x: start.x, y: start.y, scale: start.scale, rotation: start.rotation, opacity: start.opacity };
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
// A station only reads as a real "landing" if the follower actually rests there for a
// moment before the next transit's curve pulls it onward. Sections with little natural
// scroll room after their own dock (e.g. a single-viewport hero) could otherwise collapse
// this to near zero, so every dock keeps at least this much hold distance.
const MIN_HOLD_VIEWPORTS = 0.4;
// How far the lower tip banks into the horizontal direction of travel while
// flying. Kept small ("leicht") so straight vertical motion reads as upright
// and diagonal motion only leans, never rolls onto its side.
const HEADING_TILT_MAX_DEGREES = 8;

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
    if (!root || !entity || !canvas || !video || !coreCanvas || !fallback || !debugOutput) return;

    // The mobile layout deliberately omits the travelling WebGL object. Do not
    // allocate a WebGL context, decode its source video, or start its
    // animation loop when the object is not part of the mobile experience.
    if (window.matchMedia('(max-width: 699px)').matches) {
      video.pause();
      video.preload = 'none';
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) return;

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

    // The video decodes at its own native frame rate (well under the 60fps
    // render loop); re-uploading the same decoded pixels to the GPU via
    // texImage2D on every rAF tick was pure waste and the single costliest
    // call in this loop. requestVideoFrameCallback fires exactly once per
    // real decoded frame, so it's the correct signal for "a new upload is
    // actually needed" - unlike video.currentTime, which some browsers
    // report as a continuously interpolated clock rather than a frame-
    // quantized value.
    let newVideoFrameAvailable = true;
    const supportsVideoFrameCallback = typeof video.requestVideoFrameCallback === 'function';
    let videoFrameCallbackHandle = 0;
    const scheduleVideoFrameCallback = () => {
      videoFrameCallbackHandle = video.requestVideoFrameCallback(() => {
        newVideoFrameAvailable = true;
        scheduleVideoFrameCallback();
      });
    };
    if (supportsVideoFrameCallback) scheduleVideoFrameCallback();

    const renderCore = () => {
      if (!coreRendererAvailable || !gl || !texture || !switchOffLocation || reducedMotion.matches || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        coreCanvas.style.opacity = '0';
        fallback.style.opacity = '1';
        return;
      }
      const heroPhase = root.dataset.heroPhase ?? 'revealed';
      if (heroPhase !== lastHeroPhase) {
        if (heroPhase === 'ignition') introIgnitionStartedAt = performance.now();
        if (heroPhase === 'revealed' && lastHeroPhase !== 'revealed') {
          video.currentTime = 0;
          void video.play().catch(() => undefined);
        }
        lastHeroPhase = heroPhase;
      }
      const introElapsed = introIgnitionStartedAt ? performance.now() - introIgnitionStartedAt : 9999;
      const duringIgnitionEffect = introElapsed < 820;
      // Nothing the shader draws can have changed since the last call: no
      // new decoded pixels, and the one wall-clock-driven effect (the
      // ignition power-up disruption) isn't currently animating.
      if (supportsVideoFrameCallback && !newVideoFrameAvailable && !duringIgnitionEffect) {
        coreCanvas.style.opacity = '1';
        fallback.style.opacity = '0';
        return;
      }
      newVideoFrameAvailable = false;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      // AILA's authored idle motion already contains its complete expression.
      // Keep the chroma-key renderer clean so the character is not fragmented
      // by the former organism's switch effects.
      gl.uniform1f(switchOffLocation, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      coreCanvas.style.opacity = '1';
      fallback.style.opacity = '0';
    };

    let frame = 0;
    const urlParameters = new URLSearchParams(window.location.search);
    const flightEditorActive = urlParameters.get('flight-editor') === '1' || urlParameters.get('flightDebug') === '1';
    const debugPath = urlParameters.get('debug-path') === '1';
    debugOutput.hidden = !debugPath;
    // The draft (points + followSpeed) always comes from the shared store -
    // never a local copy. Normal mode reads whatever the store was
    // initialized with from flight-path.json; editor mode's dragging writes
    // straight back into the same store, so this always reflects it live.
    let followSpeed = getFlightPathDraft().followSpeed;
    let route: ResolvedPoint[] = [];
    let pathRoute: ResolvedPoint[] = [];
    let masterPath: MasterFlightPath | null = null;
    let dockingProgress: DockProgressPoint[] = [];
    const pathFollower = new Object3D();
    const firstDraftPoint = getFlightPathDraft().points[0];
    let current = root.dataset.heroPhase === 'loading'
      ? { ...getIntroPosition(), opacity: 0 }
      : { x: firstDraftPoint.x, y: firstDraftPoint.y, scale: firstDraftPoint.scale, rotation: firstDraftPoint.rotation, opacity: 0 };
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
      const draft = getFlightPathDraft();
      followSpeed = draft.followSpeed;
      route = draft.points.map((point) => {
        const section = document.getElementById(point.id);
        if (!section) return {
          ...point,
          scroll: 0,
          documentX: viewportWidth * point.x / 100,
          documentY: viewportHeight * point.y / 100,
        };
        const rect = section.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top;
        const stop = dockingStopForAnchor(point.dockAnchor);
        // Docking stations keep their own well-tuned "when does this station
        // arrive" formula (a fraction of the section's scrollable distance,
        // matched to its rest offset), independent of x/y/scale which are now
        // freely editable. Reusing the generic control-point sectionOffset
        // formula for docks shifted their arrival scroll, so the object's
        // target progress raced ahead of what the damping could track.
        const scroll = stop
          ? absoluteTop + Math.max(section.offsetHeight - viewportHeight, viewportHeight * .65, 1) * stop.rest
          : absoluteTop + rect.height * point.sectionOffset - viewportHeight * .5;
        // Keep the route's virtual tail beyond the browser's physical maximum
        // scroll. Otherwise all contact points collapse onto one value and the
        // final docking node becomes ambiguous.
        const resolvedScroll = Math.max(0, scroll);
        const dockTarget = point.dockAnchor
          ? resolveDockViewportTarget(point.dockAnchor, resolvedScroll, { width: viewportWidth, height: viewportHeight })
          : null;
        const resolvedPoint = dockTarget
          ? { ...point, x: dockTarget.x, y: dockTarget.y }
          : point;
        return {
          ...resolvedPoint,
          scroll: resolvedScroll,
          documentX: viewportWidth * resolvedPoint.x / 100,
          documentY: resolvedScroll + viewportHeight * resolvedPoint.y / 100,
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
        const finalDockTarget = route[routeIndex].dockAnchor
          ? resolveDockViewportTarget(route[routeIndex].dockAnchor as string, route[routeIndex].scroll, { width: viewportWidth, height: viewportHeight })
          : null;
        route[routeIndex] = {
          ...route[routeIndex],
          ...(finalDockTarget ? {
            x: finalDockTarget.x,
            y: finalDockTarget.y,
            documentX: viewportWidth * finalDockTarget.x / 100,
            documentY: route[routeIndex].scroll + viewportHeight * finalDockTarget.y / 100,
          } : {}),
          departureScroll: nextStop
            ? Math.max(route[routeIndex].scroll + viewportHeight * MIN_HOLD_VIEWPORTS, nextSectionTop - viewportHeight)
            : maximumScroll,
        };
      });
      // The final station is the physical end of the page. On compact tablet
      // layouts its authored arrival can land a few pixels beyond the
      // browser's maximum scroll, while the preceding minimum-transit rule
      // still expects another .48 viewport of travel. That leaves CONTACT in
      // a permanent "approach" state. Clamp the terminal arrival to the real
      // scroll limit and end the preceding hold early enough to preserve one
      // complete transit into it.
      const terminalDockIndex = dockIndexes[dockIndexes.length - 1];
      const penultimateDockIndex = dockIndexes[dockIndexes.length - 2];
      if (terminalDockIndex !== undefined) {
        const terminalArrival = Math.min(route[terminalDockIndex].scroll, maximumScroll);
        route[terminalDockIndex] = {
          ...route[terminalDockIndex],
          scroll: terminalArrival,
          documentY: terminalArrival + viewportHeight * route[terminalDockIndex].y / 100,
        };
        if (penultimateDockIndex !== undefined) {
          const currentDeparture = route[penultimateDockIndex].departureScroll ?? route[penultimateDockIndex].scroll;
          const latestDeparture = Math.max(
            route[penultimateDockIndex].scroll,
            terminalArrival - viewportHeight * MIN_TRANSIT_VIEWPORTS,
          );
          route[penultimateDockIndex] = {
            ...route[penultimateDockIndex],
            departureScroll: Math.min(currentDeparture, latestDeparture),
          };
        }
      }
      // Control points between docks get their scroll from where they actually
      // sit on the master curve (arc-length progress), not from their raw
      // array index. mapScrollToPathProgress() ramps path progress *linearly
      // in scroll* between two docks; inverting that ramp at a point's real
      // progress is what puts its assigned scroll back where the curve (and
      // the rail line/object built from it) actually pass through its x/y.
      // Index-based interpolation ignored how unevenly points are spaced
      // along the curve - measured up to ~210px off on a sharply curved or
      // asymmetric segment. Geometry (x/y/scale) never depends on .scroll, so
      // this preview build's placeholder scroll values don't affect progress;
      // the real pathRoute/masterPath below still gets built fresh afterward.
      const previewPathRoute: ResolvedPoint[] = [
        { ...draft.start, scroll: 0, documentX: viewportWidth * draft.start.x / 100, documentY: viewportHeight * draft.start.y / 100 },
        ...route,
      ];
      const progressModel = masterPath ?? createMasterFlightPath(previewPathRoute);
      if (masterPath) progressModel.updateFromNodes(previewPathRoute);
      const nodeProgress = (routeIndex: number) => progressModel.getNodeProgress(routeIndex + 1);

      const firstDockIndex = dockIndexes[0] ?? -1;
      if (firstDockIndex > 0) {
        const firstDockScroll = route[firstDockIndex].scroll;
        const firstDockProgress = nodeProgress(firstDockIndex);
        for (let index = 0; index < firstDockIndex; index += 1) {
          const amount = firstDockProgress > 0.000001 ? nodeProgress(index) / firstDockProgress : (index + 1) / (firstDockIndex + 1);
          const scroll = firstDockScroll * amount;
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
        const fromProgress = nodeProgress(fromIndex);
        const progressSpan = nodeProgress(toIndex) - fromProgress;
        for (let index = fromIndex + 1; index < toIndex; index += 1) {
          const amount = progressSpan > 0.000001 ? (nodeProgress(index) - fromProgress) / progressSpan : (index - fromIndex) / (toIndex - fromIndex);
          const scroll = mix(fromScroll, toScroll, amount);
          route[index] = {
            ...route[index],
            scroll,
            documentY: scroll + viewportHeight * route[index].y / 100,
          };
        }
      });

      // Points past the last dock (e.g. the editor-only "Ziel" anchor and its
      // intermediates) aren't touched by the interpolation above and keep
      // their own sectionOffset-derived scroll, which can exceed the page's
      // real scrollable height. Never visited by the runtime object, but the
      // editor still renders their anchor/label there, and an out-of-range
      // document position would silently grow document.scrollHeight beyond
      // what the rail (correctly capped at maximumScroll) draws.
      const lastDockIndex = dockIndexes[dockIndexes.length - 1] ?? -1;
      for (let index = lastDockIndex + 1; index < route.length; index += 1) {
        if (route[index].scroll <= maximumScroll) continue;
        route[index] = {
          ...route[index],
          scroll: maximumScroll,
          documentY: maximumScroll + viewportHeight * route[index].y / 100,
        };
      }

      pathRoute = [{
        ...draft.start,
        scroll: 0,
        documentX: viewportWidth * draft.start.x / 100,
        documentY: viewportHeight * draft.start.y / 100,
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

      let railPath = '';
      if (flightEditorActive) {
        // The debug rail must reflect the real scroll -> progress mapping,
        // including docking holds (many scrollY values sharing one path
        // progress) - not a uniform sweep over progress. Sampling by actual
        // scrollY, through the same mapScrollToPathProgress() the object
        // itself uses, is what keeps the drawn line and the live object
        // provably on the same curve.
        //
        // mapScrollToPathProgress has a genuine slope discontinuity at every
        // dock's arrivalScroll and departureScroll (transit stops or starts
        // changing progress right there). An evenly-spaced grid can land a
        // few px to either side of that exact scrollY, and the straight
        // polyline segment between its neighbors then corner-cuts the real
        // kink - independently measured (getBoundingClientRect vs
        // getPointAtLength/getScreenCTM) as >1px at those two points.
        // Forcing an exact vertex at every arrival/departure removes that
        // corner-cutting outright, instead of just sampling more densely
        // everywhere.
        const railStep = Math.max(6, Math.round(maximumScroll / 1400));
        const scrollSamples = new Set<number>();
        for (let scrollSample = 0; scrollSample <= maximumScroll; scrollSample += railStep) scrollSamples.add(scrollSample);
        scrollSamples.add(maximumScroll);
        dockingProgress.forEach((dock) => {
          if (Number.isFinite(dock.arrivalScroll)) scrollSamples.add(clamp(dock.arrivalScroll, 0, maximumScroll));
          if (Number.isFinite(dock.departureScroll)) scrollSamples.add(clamp(dock.departureScroll, 0, maximumScroll));
        });
        // The uniform grid above spaces samples across the *whole* scroll range, so a single
        // Bezier segment with a small scroll span (e.g. two consecutive anchors that sit only
        // ~200px of scroll apart) gets very few of them. That's fine while the segment's own
        // on-screen shape is simple, but the editor now lets a handle be dragged out from
        // scratch on any segment - including ones between anchors that share the same x/y - and
        // a sizeable handle there produces a tight visual loop within that tiny scroll span. A
        // sparse polyline corner-cuts a loop like that by several px (independently measured up
        // to ~7px). Each pathRoute[i]->pathRoute[i+1] pair is exactly one master-curve segment
        // (see masterFlightPath.ts's build()), so guarantee a minimum sample count within every
        // individual segment's own scroll span, regardless of how short that span is.
        const MIN_SAMPLES_PER_SEGMENT = 40;
        for (let index = 0; index < pathRoute.length - 1; index += 1) {
          const segmentStartScroll = pathRoute[index].scroll;
          const segmentEndScroll = pathRoute[index + 1].scroll;
          const span = segmentEndScroll - segmentStartScroll;
          if (span <= 0) continue;
          for (let step = 0; step <= MIN_SAMPLES_PER_SEGMENT; step += 1) {
            scrollSamples.add(clamp(segmentStartScroll + (span * step) / MIN_SAMPLES_PER_SEGMENT, 0, maximumScroll));
          }
        }
        const sortedScrollSamples = Array.from(scrollSamples).sort((a, b) => a - b);
        const railCommands: string[] = sortedScrollSamples.map((scrollSample, index) => {
          const sampleTarget = mapScrollToPathProgress(scrollSample, viewportHeight, dockingProgress);
          const sample = sampleMasterFlightPath(resolvedMasterPath, sampleTarget.targetPathProgress);
          const { documentX, documentY } = pathSampleToDocument(sample.position, scrollSample, { width: viewportWidth, height: viewportHeight });
          return `${index === 0 ? 'M' : 'L'} ${documentX.toFixed(1)} ${documentY.toFixed(1)}`;
        });
        railPath = railCommands.join(' ');
      }

      setResolvedFlightPath({ route, pathRoute, masterPath: resolvedMasterPath, dockingProgress, railPath, viewportWidth, viewportHeight });
    };

    const positionOnRail = (pathProgress: number) => {
      if (!masterPath) return { ...getIntroPosition() };
      const sample = sampleMasterFlightPath(masterPath, pathProgress);
      currentRouteScroll = sample.routeScroll;
      // This is the sole runtime writer of the carrier's world position.
      pathFollower.position.copy(sample.position);
      entity.dataset.pathSegment = String(sample.segmentIndex);
      entity.dataset.pathCurveProgress = sample.curveProgress.toFixed(6);
      // Bank the lower tip into the horizontal component of the real travel
      // direction: pure vertical motion (straight up or down) keeps the
      // object upright, diagonal motion leans the tip toward that side.
      // Convert the tangent out of vw/vh percentage space into real screen
      // pixels first so viewport aspect ratio can't skew which way reads as
      // "diagonal".
      const headingDx = sample.tangent.x * window.innerWidth;
      const headingDy = sample.tangent.y * window.innerHeight;
      const headingSpeed = Math.hypot(headingDx, headingDy);
      const headingTilt = headingSpeed > 0.0001
        ? clamp(headingDx / headingSpeed, -1, 1) * HEADING_TILT_MAX_DEGREES
        : 0;
      return {
        x: pathFollower.position.x,
        y: pathFollower.position.y,
        scale: clamp(pathFollower.position.z, .1, 2),
        rotation: headingTilt,
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
        current = followsRail ? positionOnRail(currentPathProgress) : { ...getIntroPosition() };
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

        // A radial gradient reaches the same soft glow as the previous
        // shadowBlur fill without its expensive offscreen blur-and-composite
        // pass - shadowBlur on up to 120 shapes every frame was the single
        // costliest part of this loop.
        const radius = Math.max(.22, particle.size * (1 - age * .52));
        const glowRadius = radius * 2.4;
        const [r, g, b] = particle.color === 'gold' ? [240, 203, 108] : [151, 36, 54];
        const coreAlpha = particle.color === 'gold' ? dissolve * .72 : dissolve * .62;
        const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, glowRadius);
        glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${coreAlpha})`);
        glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        context.beginPath();
        context.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
        context.fillStyle = glow;
        context.fill();
      }
      context.globalCompositeOperation = 'source-over';
    };

    const render = (now: number) => {
      const deltaTime = clamp((now - previousFrameTime) / 1000, 1 / 240, 1 / 30);
      previousFrameTime = now;
      scrollVelocity *= Math.exp(-deltaTime * 5.2);
      const responseRate = PATH_DAMPING * clamp(followSpeed, .25, 2.5)
        + clamp(scrollVelocity / 260, 0, 7);
      currentPathProgress = reducedMotion.matches || flightEditorActive
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
        const intro = getIntroPosition();
        current = { ...intro, opacity: root.dataset.heroPhase === 'loading' ? 0 : intro.opacity };
      }

      const activeStop = DOCKING_STOPS[pathTarget.activeStationIndex];
      // The route needs a projected dock position before that station is on
      // screen. Once the follower is genuinely docked, however, use the
      // browser's live ring rectangle as the final authority. This keeps the
      // object and the visible graphic pixel-coupled even when a responsive
      // clamp, a sticky transition, loaded fonts/images or mobile browser UI
      // changed the section geometry after resolveRoute() ran.
      if (docked && activeStop) {
        const liveDockTarget = measureVisibleDockViewportTarget(activeStop.anchor, {
          width: window.innerWidth,
          height: window.innerHeight,
        });
        if (liveDockTarget) {
          current = { ...current, x: liveDockTarget.x, y: liveDockTarget.y };
        }
      }
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

      if (flightEditorActive && masterPath) {
        // Real, independent DOM/SVG measurement - not a second read of the
        // same store value. The object's position comes from the rendered
        // wrapper's own layout box; the rail's position comes from walking
        // the actually-rendered <path> geometry via getPointAtLength +
        // getScreenCTM. Two different browser APIs measuring two different
        // elements, exactly like the automated pixel test.
        const scrollYNow = window.scrollY;
        let distancePx = 0;
        const railPathElement = document.querySelector<SVGPathElement>('[data-flight-path-editor-root] path[data-flight-path-rail-line]');
        if (railPathElement) {
          const entityRect = entity.getBoundingClientRect();
          const objectScreen = { x: entityRect.left + entityRect.width / 2, y: entityRect.top + entityRect.height / 2 };
          const targetDocumentY = objectScreen.y + scrollYNow;
          const totalLength = railPathElement.getTotalLength();
          let lo = 0;
          let hi = totalLength;
          for (let i = 0; i < 24; i += 1) {
            const mid = (lo + hi) / 2;
            if (railPathElement.getPointAtLength(mid).y < targetDocumentY) lo = mid; else hi = mid;
          }
          const svgPoint = railPathElement.getPointAtLength((lo + hi) / 2);
          const ctm = railPathElement.getScreenCTM();
          if (ctm) {
            const screenPoint = new DOMPoint(svgPoint.x, svgPoint.y).matrixTransform(ctm);
            distancePx = Math.hypot(objectScreen.x - screenPoint.x, objectScreen.y - screenPoint.y);
          }
        }

        const segmentIndex = Number(entity.dataset.pathSegment ?? -1);
        const phaseLabel: FlightPathRuntimeState['phaseLabel'] = pathTarget.phase === 'transit'
          ? (pathTarget.transitProgress < 0.08 ? 'ARRIVAL' : 'TRANSIT')
          : docked
            ? (pathTarget.sectionProgress > 0.92 ? 'DEPARTURE' : 'HOLD')
            : 'ARRIVAL';

        setFlightPathRuntime({
          currentPathProgress,
          targetPathProgress,
          station: activeStop?.number ?? '',
          activeSectionId: pathTarget.activeSectionId,
          phase: pathTarget.phase,
          phaseLabel,
          segmentIndex,
          distancePx,
          x: current.x,
          y: current.y,
          scale: current.scale,
          routeScroll: currentRouteScroll,
          scrollY: scrollYNow,
        });
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

      // The entity is viewport-fixed (vw/vh); the rail is now sampled by the
      // exact same mapScrollToPathProgress(window.scrollY) call this render
      // loop uses, through the same masterPath instance, so no separate
      // document-space correction is needed here - see the precision test
      // above, which measures that directly instead of assuming it.
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

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(handleResize);
    resizeObserver?.observe(root);
    DOCKING_STOPS.forEach((stop) => {
      const station = document.querySelector<HTMLElement>(`[data-docking-anchor="${stop.anchor}"]`);
      if (station) resizeObserver?.observe(station);
      if (station?.parentElement) resizeObserver?.observe(station.parentElement);
    });
    void document.fonts?.ready.then(handleResize);

    const handleDockCalibration = () => {
      resolveRoute();
      requestRender();
    };

    // The one and only place ScrollEntity learns about a point edit: the
    // shared draft store changed (whether that came from the editor drag or
    // anywhere else). No CustomEvent, no local copy - resolveRoute() reads
    // getFlightPathDraft() itself every time it runs.
    const unsubscribeDraft = subscribeFlightPathDraft(() => {
      resolveRoute();
      requestRender();
    });

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
    window.addEventListener('orientationchange', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('load', handleResize);
    window.addEventListener('dock-calibration-change', handleDockCalibration);
    reducedMotion.addEventListener('change', handleMotionPreference);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (supportsVideoFrameCallback) video.cancelVideoFrameCallback(videoFrameCallbackHandle);
      video.pause();
      if (gl && texture) gl.deleteTexture(texture);
      if (gl && buffer) gl.deleteBuffer(buffer);
      if (gl && program) gl.deleteProgram(program);
      if (gl && vertexShader) gl.deleteShader(vertexShader);
      if (gl && fragmentShader) gl.deleteShader(fragmentShader);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('load', handleResize);
      window.removeEventListener('dock-calibration-change', handleDockCalibration);
      unsubscribeDraft();
      reducedMotion.removeEventListener('change', handleMotionPreference);
      heroPhaseObserver.disconnect();
      resizeObserver?.disconnect();
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
          left: `${getFlightPathDraft().start.x}vw`,
          top: `${getFlightPathDraft().start.y}vh`,
          opacity: getFlightPathDraft().start.opacity,
          transform: `translate3d(-50%, -50%, 0) rotate(${getFlightPathDraft().start.rotation}deg) scale(${getFlightPathDraft().start.scale})`,
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
          <source src="/cinematic/aila/aila-idle-v1-pingpong-greenscreen.mp4" type="video/mp4" />
        </video>
        <img
          ref={fallbackRef}
          className={`${styles.scrollEntityCore} ${styles.scrollEntityFallback}`}
          src="/cinematic/aila/aila-idle-v1-fallback-transparent.png"
          alt=""
          draggable="false"
        />
        <canvas ref={coreCanvasRef} className={styles.scrollEntityVideo} width="960" height="540" />
      </div>
      <output ref={debugRef} className={styles.scrollPathDebug} hidden aria-live="off" />
      <TitleDepthLayer />
      <FlightPathEditor />
    </>
  );
}
