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
    let pressedUntil = 0;

    function onMove(e: PointerEvent) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      visible = true;
    }
    function onDown(e: PointerEvent) {
      onMove(e);
      pressedUntil = performance.now() + 280;
    }
    function onLeave() { visible = false; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown);
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
        const clicked = now < pressedUntil;

        ctx!.save();
        ctx!.translate(core.x, core.y);
        ctx!.rotate(-Math.PI / 4);
        ctx!.beginPath();
        ctx!.moveTo(0, 0);
        ctx!.lineTo(-8, 13);
        ctx!.moveTo(0, 0);
        ctx!.lineTo(8, 13);
        ctx!.strokeStyle = clicked ? '#f6e3a1' : '#ffffff';
        ctx!.lineWidth = 2.2;
        ctx!.lineCap = 'round';
        ctx!.lineJoin = 'round';
        ctx!.shadowColor = clicked ? 'rgba(231,197,106,0.95)' : 'transparent';
        ctx!.shadowBlur = clicked ? 8 : 0;
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
      window.removeEventListener('pointerdown', onDown);
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
