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
const GOLD_LIGHT = [255, 218, 103] as const;
const GOLD_CORE = [235, 171, 46] as const;
const GOLD_DEEP = [137, 82, 15] as const;
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
        depth: kind === 'text' ? .94 + randomA * .18 : .58 + randomA * .88,
        drift: kind === 'text' ? .04 + randomB * .12 : .35 + randomB * 1.35,
        size: kind === 'text' ? .58 + randomA * .38 : .82 + randomA * 1.05,
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

      const centerX = width * .48;
      const centerY = height * .51;
      const radiusX = width * .43;
      const radiusY = height * .37;
      let particleIndex = 0;

      // An irregular, depth-staggered contour suggests a speech cloud without
      // ever drawing a filled panel behind the message.
      const contourCount = Math.round(width * .72);
      for (let index = 0; index < contourCount; index += 1) {
        const angle = index / contourCount * Math.PI * 2;
        const organic = 1 + Math.sin(angle * 3 + .65) * .035 + Math.sin(angle * 5 - .4) * .018;
        const x = centerX + Math.cos(angle) * radiusX * organic;
        const y = centerY + Math.sin(angle) * radiusY * organic;
        const frontLight = Math.sin(angle) > .15 ? 'gold' : undefined;
        addParticle(x, y, 'contour', particleIndex++, frontLight);
      }

      // A loose particle tail points toward AILA on the right, replacing the
      // geometric speech-bubble triangle with a soft, organic drift.
      const tailStartX = centerX + radiusX * .9;
      const tailStartY = centerY + radiusY * .34;
      for (let index = 0; index < 54; index += 1) {
        const progress = index / 53;
        const spread = (1 - progress) * 5.5;
        const x = tailStartX + progress * width * .115 + Math.sin(progress * Math.PI) * 4;
        const y = tailStartY + progress * height * .15 + Math.sin(index * 1.9) * spread;
        addParticle(x, y, 'contour', particleIndex++, progress > .62 ? 'light' : 'gold');
      }

      // A few points live in front of and behind the contour. Different size,
      // brightness and drift speeds create the requested spatial depth.
      for (let index = 0; index < 94; index += 1) {
        const angle = index / 94 * Math.PI * 2 + Math.sin(index * 2.17) * .13;
        const layer = index % 3;
        const x = centerX + Math.cos(angle) * radiusX * (layer === 0 ? .91 : 1.07);
        const y = centerY + Math.sin(angle) * radiusY * (layer === 2 ? 1.13 : .9);
        addParticle(x, y, 'halo', particleIndex++, layer === 0 ? 'deep' : 'gold');
      }

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
      const sampleStep = 2;
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
          const release = releaseMotion(particle, index);
          const x = mix(particle.sourceX, particle.targetX, gather)
            + release.x
            + Math.sin(time * (.52 + particle.depth * .16) + particle.phase) * particle.drift * residualDrift;
          const y = mix(particle.sourceY, particle.targetY, gather)
            + release.y
            + Math.cos(time * (.46 + particle.depth * .13) + particle.phase) * particle.drift * residualDrift;
          const radius = particle.size * particle.depth * 2.25;
          const alpha = visibility * .055 * particle.depth * release.alpha;
          const glowColor = particle.tone === 'light' ? GOLD_LIGHT : GOLD_CORE;
          context.fillStyle = `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${alpha})`;
          context.fillRect(x - radius / 2, y - radius / 2, radius, radius);
        });
        context.restore();

        // Crisp particle pass: tiny squares and circles at different depths.
        particles.forEach((particle, index) => {
          const gather = particle.kind === 'text' ? formation : Math.min(1, formation * 1.13);
          const residualDrift = particle.kind === 'text'
            ? .035 + (1 - gather) * 1.12
            : .18 + (1 - gather) * 1.45;
          const release = releaseMotion(particle, index);
          const x = mix(particle.sourceX, particle.targetX, gather)
            + release.x
            + Math.sin(time * (.52 + particle.depth * .16) + particle.phase) * particle.drift * residualDrift;
          const y = mix(particle.sourceY, particle.targetY, gather)
            + release.y
            + Math.cos(time * (.46 + particle.depth * .13) + particle.phase) * particle.drift * residualDrift;
          const shimmer = particle.kind === 'text'
            ? .94 + Math.sin(time * .78 + particle.phase) * .06
            : .76 + Math.sin(time * 1.25 + particle.phase) * .24;
          const alpha = visibility
            * shimmer
            * (particle.kind === 'text' ? 1 : particle.kind === 'contour' ? .38 : .22)
            * Math.min(1, gather * 1.6)
            * release.alpha;
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
            context.arc(x, y, Math.max(.38, size * .52), 0, Math.PI * 2);
            context.fill();
          } else {
            context.fillRect(x - size / 2, y - size / 2, size, size);
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
