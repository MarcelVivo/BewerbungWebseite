'use client';

import { useEffect, useRef } from 'react';
import styles from './experience.module.css';

type GreetingParticle = {
  targetX: number;
  targetY: number;
  sourceX: number;
  sourceY: number;
  phase: number;
  depth: number;
  drift: number;
  size: number;
  tone: 'light' | 'gold' | 'deep';
  kind: 'text' | 'contour' | 'halo';
};

const MESSAGE = 'Hallo, ich bin Lena';
const GOLD_LIGHT = [255, 190, 73] as const;
const GOLD_CORE = [211, 119, 25] as const;
const GOLD_DEEP = [101, 51, 11] as const;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);

export default function AilaParticleGreeting() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const carrier = canvas?.closest<HTMLElement>('[data-scroll-path-follower]');
    const context = canvas?.getContext('2d');
    if (!canvas || !carrier || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let particles: GreetingParticle[] = [];
    let logicalWidth = 360;
    let logicalHeight = 126;
    let active = carrier.dataset.greeting === 'true';
    let stateChangedAt = performance.now();
    let animationFrame = 0;

    const addParticle = (
      targetX: number,
      targetY: number,
      kind: GreetingParticle['kind'],
      index: number,
      tone?: GreetingParticle['tone'],
    ) => {
      const seed = index * 12.9898 + targetX * .173 + targetY * .319;
      const randomA = Math.abs(Math.sin(seed) * 43758.5453) % 1;
      const randomB = Math.abs(Math.sin(seed * 1.731) * 19642.349) % 1;
      const angle = randomA * Math.PI * 2;
      const distance = kind === 'text' ? 22 + randomB * 52 : 15 + randomB * 42;
      particles.push({
        targetX,
        targetY,
        sourceX: targetX + Math.cos(angle) * distance,
        sourceY: targetY + Math.sin(angle) * distance * .62,
        phase: angle + randomB * 4,
        depth: kind === 'text' ? .96 + randomA * .12 : .58 + randomA * .88,
        drift: kind === 'text' ? .025 + randomB * .075 : .35 + randomB * 1.35,
        size: kind === 'text'
          ? .38 + randomA * .28
          : kind === 'contour'
            ? 1.02 + randomA * .92
            : .68 + randomA * .8,
        tone: tone ?? (randomA > .78 ? 'light' : randomA > .24 ? 'gold' : 'deep'),
        kind,
      });
    };

    const rebuildParticles = () => {
      const width = Math.max(260, canvas.clientWidth || 360);
      const height = Math.max(92, canvas.clientHeight || 126);
      const deviceScale = Math.min(window.devicePixelRatio || 1, 2);
      logicalWidth = width;
      logicalHeight = height;
      canvas.width = Math.round(width * deviceScale);
      canvas.height = Math.round(height * deviceScale);
      context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
      particles = [];

      const centerX = width * .565;
      const centerY = height * .51;
      const left = width * .17;
      const right = width * .955;
      const top = height * .15;
      const bottom = height * .86;
      const bevel = (bottom - top) * .205;
      const buttonShape = [
        { x: left + bevel, y: top },
        { x: right, y: top },
        { x: right - bevel, y: bottom },
        { x: left, y: bottom },
      ];
      let particleIndex = 0;

      const traceButtonShape = (
        points: typeof buttonShape,
        kind: 'contour' | 'halo',
        spacing: number,
      ) => {
        points.forEach((point, edgeIndex) => {
          const next = points[(edgeIndex + 1) % points.length];
          const edgeLength = Math.hypot(next.x - point.x, next.y - point.y);
          const count = Math.max(4, Math.round(edgeLength / spacing));
          for (let index = 0; index < count; index += 1) {
            const progress = index / count;
            const organicDrift = Math.sin(index * 1.71 + edgeIndex * 2.4) * (kind === 'contour' ? .24 : .58);
            const x = mix(point.x, next.x, progress) + (edgeIndex % 2 ? organicDrift : 0);
            const y = mix(point.y, next.y, progress) + (edgeIndex % 2 ? 0 : organicDrift);
            addParticle(x, y, kind, particleIndex++, edgeIndex === 1 ? 'light' : 'gold');
          }
        });
      };

      // The exact skewed silhouette used by the site's gold CTA buttons,
      // translated into a particulate outline instead of a filled surface.
      traceButtonShape(buttonShape, 'contour', 1.82);

      // A subtle horizontal particle bridge runs from AILA's mouth into the
      // midpoint of the bubble's left bevel.
      const connectorEnd = {
        x: (buttonShape[0].x + buttonShape[3].x) / 2,
        y: (buttonShape[0].y + buttonShape[3].y) / 2,
      };
      for (let index = 0; index < 36; index += 1) {
        const progress = index / 35;
        const envelope = Math.sin(progress * Math.PI);
        const x = mix(width * .01, connectorEnd.x, progress);
        const y = connectorEnd.y + Math.sin(index * 1.57) * envelope * 1.15;
        addParticle(x, y, 'contour', particleIndex++, progress < .34 ? 'light' : 'gold');
      }

      // A larger, looser duplicate creates depth without reintroducing an
      // oval halo that would weaken the shared button language.
      const haloShape = buttonShape.map((point) => ({
        x: centerX + (point.x - centerX) * 1.035,
        y: centerY + (point.y - centerY) * 1.1,
      }));
      traceButtonShape(haloShape, 'halo', 7.2);

      // Rasterize the type only as a temporary sampling mask. The visible
      // lettering itself is rebuilt below exclusively from individual points.
      const mask = document.createElement('canvas');
      mask.width = Math.round(width);
      mask.height = Math.round(height);
      const maskContext = mask.getContext('2d', { willReadFrequently: true });
      if (!maskContext) return;
      const fontSize = Math.max(24, Math.min(29, width * .074));
      maskContext.clearRect(0, 0, width, height);
      maskContext.fillStyle = '#fff';
      maskContext.font = `700 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
      maskContext.textAlign = 'center';
      maskContext.textBaseline = 'middle';
      maskContext.fillText(MESSAGE, centerX - width * .012, centerY + 1);
      const pixels = maskContext.getImageData(0, 0, mask.width, mask.height).data;
      const sampleStep = 1;
      for (let y = 0; y < mask.height; y += sampleStep) {
        for (let x = 0; x < mask.width; x += sampleStep) {
          if (pixels[(y * mask.width + x) * 4 + 3] < 42) continue;
          addParticle(x, y, 'text', particleIndex++, x % 9 < 5 ? 'light' : 'gold');
        }
      }
    };

    const updateActiveState = () => {
      const nextActive = carrier.dataset.greeting === 'true';
      if (nextActive === active) return;
      active = nextActive;
      stateChangedAt = performance.now();
    };

    const observer = new MutationObserver(updateActiveState);
    observer.observe(carrier, { attributes: true, attributeFilter: ['data-greeting'] });
    const resizeObserver = new ResizeObserver(rebuildParticles);
    resizeObserver.observe(canvas);
    rebuildParticles();

    const render = (now: number) => {
      const elapsed = now - stateChangedAt;
      const visibility = reducedMotion.matches
        ? (active ? 1 : 0)
        : active
          ? easeOut((elapsed - 720) / 1050)
          : 1 - easeOut(elapsed / 520);
      const formation = reducedMotion.matches
        ? visibility
        : active
          ? easeOut((elapsed - 790) / 1180)
          : 1 - easeOut(elapsed / 620);

      context.clearRect(0, 0, logicalWidth, logicalHeight);
      if (visibility > .002) {
        const time = now * .001;
        const releaseMotion = (particle: GreetingParticle, index: number) => {
          const canRelease = particle.kind !== 'text' || index % 43 === 0;
          if (!canRelease || formation < .94 || reducedMotion.matches) {
            return { x: 0, y: 0, alpha: 1 };
          }

          const cycleOffset = (Math.sin(particle.phase * 2.31 + index * .013) + 1) * .5;
          const cycle = (time / (8.5 + particle.depth * 4.5) + cycleOffset) % 1;
          if (cycle < .055) {
            return { x: 0, y: 0, alpha: easeOut(cycle / .055) };
          }
          if (cycle < .78) return { x: 0, y: 0, alpha: 1 };

          const release = easeOut((cycle - .78) / .22);
          const distance = (particle.kind === 'text' ? 18 : 32) + particle.depth * 28;
          return {
            x: Math.cos(particle.phase * 1.37) * distance * release,
            y: (-.62 - Math.abs(Math.sin(particle.phase)) * .58) * distance * release,
            alpha: Math.pow(1 - release, .58),
          };
        };
        const particlePosition = (
          particle: GreetingParticle,
          index: number,
          gather: number,
          residualDrift: number,
        ) => {
          const release = releaseMotion(particle, index);
          return {
            x: mix(particle.sourceX, particle.targetX, gather)
              + release.x
              + Math.sin(time * (.52 + particle.depth * .16) + particle.phase) * particle.drift * residualDrift,
            y: mix(particle.sourceY, particle.targetY, gather)
              + release.y
              + Math.cos(time * (.46 + particle.depth * .13) + particle.phase) * particle.drift * residualDrift,
            releaseAlpha: release.alpha,
          };
        };
        context.globalCompositeOperation = 'lighter';

        // Soft glow pass. It follows the same points but remains slightly
        // defocused, making the particle cloud feel volumetric rather than flat.
        context.save();
        context.filter = `blur(${mix(5.5, 2.2, formation).toFixed(2)}px)`;
        particles.forEach((particle, index) => {
          // Letterforms stay crisp in the main pass below; the volumetric blur
          // belongs only to the surrounding cloud and its departing motes.
          if (particle.kind === 'text') return;
          const gather = Math.min(1, formation * 1.13);
          const residualDrift = .28 + (1 - gather) * 1.35;
          const position = particlePosition(particle, index, gather, residualDrift);
          const radius = particle.size * particle.depth * 2.25;
          const alpha = visibility * .11 * particle.depth * position.releaseAlpha;
          const glowColor = particle.tone === 'light' ? GOLD_LIGHT : GOLD_CORE;
          context.fillStyle = `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${alpha})`;
          context.fillRect(position.x - radius / 2, position.y - radius / 2, radius, radius);
        });
        context.restore();

        // A second set of very small, deep-copper pixels sits directly beneath
        // both the type and frame. It remains particulate—not a surface or
        // blur—while preserving contrast over pale footage.
        context.globalCompositeOperation = 'source-over';
        particles.forEach((particle, index) => {
          if (particle.kind === 'halo') return;
          const gather = particle.kind === 'text' ? formation : Math.min(1, formation * 1.13);
          const residualDrift = particle.kind === 'text'
            ? .025 + (1 - gather) * 1.12
            : .18 + (1 - gather) * 1.45;
          const position = particlePosition(particle, index, gather, residualDrift);
          const alpha = visibility
            * (particle.kind === 'text' ? .88 : .74)
            * Math.min(1, gather * 1.8)
            * position.releaseAlpha;
          const size = particle.size * particle.depth + (particle.kind === 'text' ? .42 : .66);
          context.fillStyle = particle.kind === 'text'
            ? `rgba(69, 31, 5, ${alpha})`
            : `rgba(82, 37, 7, ${alpha})`;
          const offset = particle.kind === 'text' ? .5 : .62;
          context.fillRect(position.x - size / 2 + offset, position.y - size / 2 + offset, size, size);
        });

        // Crisp particle pass: tiny squares and circles at different depths.
        context.globalCompositeOperation = 'lighter';
        particles.forEach((particle, index) => {
          const gather = particle.kind === 'text' ? formation : Math.min(1, formation * 1.13);
          const residualDrift = particle.kind === 'text'
            ? .035 + (1 - gather) * 1.12
            : .18 + (1 - gather) * 1.45;
          const position = particlePosition(particle, index, gather, residualDrift);
          const shimmer = particle.kind === 'text'
            ? .94 + Math.sin(time * .78 + particle.phase) * .06
            : .76 + Math.sin(time * 1.25 + particle.phase) * .24;
          const alpha = visibility
            * shimmer
            * (particle.kind === 'text' ? 1 : particle.kind === 'contour' ? .72 : .26)
            * Math.min(1, gather * 1.6)
            * position.releaseAlpha;
          const size = particle.size * particle.depth;
          const color = particle.tone === 'light'
            ? GOLD_LIGHT
            : particle.tone === 'deep'
              ? GOLD_DEEP
              : GOLD_CORE;
          const toneAlpha = particle.tone === 'deep' ? alpha * .72 : alpha;
          context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${toneAlpha})`;
          if ((index + particle.kind.length) % 4 === 0) {
            context.beginPath();
            context.arc(position.x, position.y, Math.max(particle.kind === 'text' ? .22 : .38, size * .52), 0, Math.PI * 2);
            context.fill();
          } else {
            context.fillRect(position.x - size / 2, position.y - size / 2, size, size);
          }
        });
        context.globalCompositeOperation = 'source-over';
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <span className={styles.ailaGreeting} role="status" aria-live="polite">
      <canvas ref={canvasRef} className={styles.ailaGreetingCanvas} aria-hidden="true" />
      <span className={styles.ailaGreetingAccessible}>{MESSAGE}</span>
    </span>
  );
}
