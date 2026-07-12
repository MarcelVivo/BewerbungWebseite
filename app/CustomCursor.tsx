'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    document.documentElement.classList.add('custom-cursor-active');

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = innerWidth * dpr;
      canvas!.height = innerHeight * dpr;
      canvas!.style.width = innerWidth + 'px';
      canvas!.style.height = innerHeight + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
    const core = { x: pointer.x, y: pointer.y };
    let lastSparkX = pointer.x, lastSparkY = pointer.y;
    let visible = false;

    function onMove(e: PointerEvent) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      visible = true;
    }
    function onLeave() { visible = false; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('mouseenter', () => { visible = true; });

    type Bolt = { x: number; y: number; life: number; maxLife: number; size: number; dx: number; dy: number; seed: number };
    const bolts: Bolt[] = [];

    function spawnBolt(x: number, y: number, dx: number, dy: number) {
      bolts.push({
        x, y,
        life: 1,
        maxLife: 0.28 + Math.random() * 0.18,
        size: 0.7 + Math.random() * 1.0,
        dx: dx * (0.07 + Math.random() * 0.09) + (Math.random() - 0.5) * 0.35,
        dy: dy * (0.07 + Math.random() * 0.09) + (Math.random() - 0.5) * 0.35,
        seed: Math.random() * 1000,
      });
    }

    function drawLightning(x: number, y: number, len: number, angle: number, seed: number, alpha: number, size: number) {
      const segments = 4;
      let cx = x, cy = y;
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const jitter = Math.sin(seed + i * 12.9) * len * 0.22 * (1 - t);
        const nx = x + Math.cos(angle) * len * t + Math.cos(angle + Math.PI / 2) * jitter;
        const ny = y + Math.sin(angle) * len * t + Math.sin(angle + Math.PI / 2) * jitter;
        ctx!.lineTo(nx, ny);
        cx = nx; cy = ny;
      }
      ctx!.strokeStyle = `rgba(142,190,242,${alpha})`;
      ctx!.lineWidth = size;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';
      ctx!.shadowColor = 'rgba(77,127,191,0.7)';
      ctx!.shadowBlur = 3;
      ctx!.stroke();
    }

    let rafId = 0;
    let last = performance.now();
    function tick(now: number) {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const ease = 1 - Math.pow(0.001, dt);
      const prevX = core.x, prevY = core.y;
      core.x += (pointer.x - core.x) * ease;
      core.y += (pointer.y - core.y) * ease;

      const moveDist = Math.hypot(core.x - lastSparkX, core.y - lastSparkY);
      if (moveDist > 6) {
        const dx = core.x - prevX, dy = core.y - prevY;
        const count = Math.min(2, Math.floor(moveDist / 9));
        for (let i = 0; i < count; i++) {
          spawnBolt(core.x, core.y, -dx, -dy);
        }
        lastSparkX = core.x; lastSparkY = core.y;
      }

      ctx!.clearRect(0, 0, innerWidth, innerHeight);

      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.life -= dt / b.maxLife;
        if (b.life <= 0) { bolts.splice(i, 1); continue; }
        b.x += b.dx; b.y += b.dy;
        const alpha = Math.max(0, b.life) * 0.45;
        const angle = Math.atan2(b.dy, b.dx);
        const len = 3 + (1 - b.life) * 4;
        drawLightning(b.x, b.y, len, angle, b.seed, alpha, b.size);
      }
      ctx!.shadowBlur = 0;

      if (visible) {
        const glowR = 16;
        const grad = ctx!.createRadialGradient(core.x, core.y, 0, core.x, core.y, glowR);
        grad.addColorStop(0, 'rgba(246,227,161,0.95)');
        grad.addColorStop(0.35, 'rgba(231,197,106,0.55)');
        grad.addColorStop(1, 'rgba(200,154,61,0)');
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(core.x, core.y, glowR, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.beginPath();
        ctx!.fillStyle = '#f6e3a1';
        ctx!.shadowColor = 'rgba(231,197,106,0.95)';
        ctx!.shadowBlur = 10;
        ctx!.arc(core.x, core.y, 3.2, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('mouseleave', onLeave);
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 999999, pointerEvents: 'none' }}
    />
  );
}
