'use client';
// @ts-nocheck

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * A deliberately small, isolated WebGL scene for the 2D story chapters.
 * The detailed brain scene can sleep behind the opaque journey while this
 * GPU-cheap neural core preserves spatial continuity between the chapters.
 */
export default function AgencyAmbientOrb() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = document.getElementById('solution-spiral');
    const surface = root?.querySelector<HTMLElement>('.agency-surface');
    if (!canvas || !root || !surface) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mobile = window.innerWidth < 700;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
    } catch {
      canvas.style.display = 'none';
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 30);
    camera.position.z = 6.4;

    const core = new THREE.Group();
    scene.add(core);

    const count = mobile ? 1250 : 2800;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let index = 0; index < count; index += 1) {
      const y = 1 - (index / Math.max(1, count - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const angle = goldenAngle * index;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = Math.sin(angle) * radius;
      seeds[index] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: mobile ? 0.28 : 0.48 },
        uColorA: { value: new THREE.Color('#e7c56a') },
        uColorB: { value: new THREE.Color('#4d7fbf') },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        varying float vSeed;
        varying float vLight;
        void main() {
          vec3 normalPosition = normalize(position);
          float slow = uTime * .18;
          float wave = sin(normalPosition.y * 4.2 + slow) * .06
            + sin(normalPosition.x * 3.1 - slow * .7) * .045
            + sin(normalPosition.z * 5.3 + slow * 1.2) * .03;
          vec3 displaced = normalPosition * (1.34 + wave);
          vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.15 + aSeed * 1.2) * (260.0 / -mv.z) * .03;
          vSeed = aSeed;
          vLight = wave + normalPosition.y * .24 + .5;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        varying float vSeed;
        varying float vLight;
        void main() {
          vec2 point = gl_PointCoord - .5;
          float distanceToCenter = length(point);
          if (distanceToCenter > .5) discard;
          float alpha = smoothstep(.5, .04, distanceToCenter);
          vec3 color = mix(uColorB, uColorA, clamp(vLight, 0.0, 1.0));
          color = mix(color, vec3(1.0), step(.92, vSeed) * .35);
          gl_FragColor = vec4(color, alpha * uOpacity * (.42 + vSeed * .58));
        }
      `,
    });

    const particles = new THREE.Points(geometry, material);
    core.add(particles);

    const wireGeometry = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.39, 2));
    const wireMaterial = new THREE.LineBasicMaterial({
      color: 0xd8c47f,
      transparent: true,
      opacity: mobile ? 0.025 : 0.055,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    core.add(wire);

    const haloGeometry = new THREE.RingGeometry(1.72, 1.725, 96);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xc89a3d,
      transparent: true,
      opacity: mobile ? 0.025 : 0.07,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    core.add(halo);

    const chapterIds = ['journey-solutions', 'journey-value', 'journey-references', 'journey-about'];
    const chapterElements = chapterIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    let chapterMetrics: Array<{ top: number; height: number }> = [];
    let surfaceMetric = { top: 0, height: 1 };
    let targetX = 0;
    let targetY = 0;
    let targetScale = 1;
    let targetOpacity = 0;
    let activeChapter = 0;
    let visible = false;
    let documentVisible = document.visibilityState === 'visible';
    let scrollFrame = 0;
    let mounted = true;

    const measure = () => {
      mobile = window.innerWidth < 700;
      const pageTop = window.scrollY;
      const surfaceRect = surface.getBoundingClientRect();
      surfaceMetric = { top: surfaceRect.top + pageTop, height: Math.max(1, surfaceRect.height) };
      chapterMetrics = chapterElements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top + pageTop, height: Math.max(1, rect.height) };
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.2));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
      camera.updateProjectionMatrix();
    };

    const updateScrollState = () => {
      scrollFrame = 0;
      const viewportHeight = Math.max(1, window.innerHeight);
      const scrollTop = window.scrollY;
      visible = scrollTop + viewportHeight > surfaceMetric.top
        && scrollTop < surfaceMetric.top + surfaceMetric.height;
      let closestDistance = Number.POSITIVE_INFINITY;
      chapterMetrics.forEach((metric, index) => {
        const distance = Math.abs(metric.top + metric.height * .5 - scrollTop - viewportHeight * .5);
        if (distance < closestDistance) {
          closestDistance = distance;
          activeChapter = index;
        }
      });
      const positionsX = mobile ? [0, 0, 0, 0] : [2.9, -2.8, 3.05, -2.75];
      const positionsY = mobile ? [-1.25, .9, -.9, .7] : [.15, -.35, .35, -.15];
      const scales = mobile ? [.72, .66, .7, .68] : [.92, .76, .84, .8];
      targetX = positionsX[activeChapter] || 0;
      targetY = positionsY[activeChapter] || 0;
      targetScale = scales[activeChapter] || .8;
      targetOpacity = visible ? (mobile ? .24 : .46) : 0;
    };

    const scheduleScrollUpdate = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState);
    };
    const handleResize = () => {
      measure();
      updateScrollState();
    };
    const handleVisibility = () => { documentVisible = document.visibilityState === 'visible'; };

    measure();
    updateScrollState();
    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('load', handleResize, { once: true });
    document.addEventListener('visibilitychange', handleVisibility);
    document.fonts?.ready.then(() => {
      if (mounted) handleResize();
    }).catch(() => {});

    let animationFrame = 0;
    let lastFrame = 0;
    let elapsed = 0;
    const render = (now: number) => {
      animationFrame = window.requestAnimationFrame(render);
      if (!documentVisible || !visible) return;
      const frameInterval = reduced ? 66 : 33;
      if (now - lastFrame < frameInterval) return;
      const delta = Math.min(.05, (now - lastFrame) / 1000 || .016);
      lastFrame = now;
      elapsed += delta;
      const easing = 1 - Math.exp(-delta * 3.8);
      core.position.x += (targetX - core.position.x) * easing;
      core.position.y += (targetY - core.position.y) * easing;
      const currentScale = core.scale.x + (targetScale - core.scale.x) * easing;
      core.scale.setScalar(currentScale);
      material.uniforms.uOpacity.value += (targetOpacity - material.uniforms.uOpacity.value) * easing;
      material.uniforms.uTime.value = reduced ? 0 : elapsed;
      if (!reduced) {
        core.rotation.y += delta * .085;
        core.rotation.x = Math.sin(elapsed * .18) * .08;
        halo.rotation.z -= delta * .045;
      }
      renderer.render(scene, camera);
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      mounted = false;
      window.cancelAnimationFrame(scrollFrame);
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', scheduleScrollUpdate);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('load', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      geometry.dispose();
      material.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  return (
    <div className="agency-ambient-orb" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
