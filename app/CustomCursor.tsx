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

    let rafId = 0;
    let last = performance.now();
    function tick(now: number) {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const ease = 1 - Math.pow(0.001, dt);
      core.x += (pointer.x - core.x) * ease;
      core.y += (pointer.y - core.y) * ease;

      ctx!.clearRect(0, 0, innerWidth, innerHeight);

      if (visible) {
        const glowR = 20;
        const grad = ctx!.createRadialGradient(core.x, core.y, 0, core.x, core.y, glowR);
        grad.addColorStop(0, 'rgba(246,227,161,0.95)');
        grad.addColorStop(0.35, 'rgba(231,197,106,0.55)');
        grad.addColorStop(1, 'rgba(200,154,61,0)');
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(core.x, core.y, glowR, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.save();
        ctx!.translate(core.x, core.y);
        ctx!.rotate(-Math.PI / 4);
        ctx!.beginPath();
        ctx!.moveTo(0, 0);
        ctx!.lineTo(-8, 13);
        ctx!.moveTo(0, 0);
        ctx!.lineTo(8, 13);
        ctx!.strokeStyle = '#f6e3a1';
        ctx!.lineWidth = 2.2;
        ctx!.lineCap = 'round';
        ctx!.lineJoin = 'round';
        ctx!.shadowColor = 'rgba(231,197,106,0.95)';
        ctx!.shadowBlur = 8;
        ctx!.stroke();
        ctx!.restore();

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
