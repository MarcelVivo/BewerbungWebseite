'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SYSTEM_CURSOR_PATHS = ['/expertise', '/login', '/dashboard', '/recruiter', '/projects', '/auth'];

export default function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname();
  const useCustomCursor = !SYSTEM_CURSOR_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (!useCustomCursor) return;
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
    let visible = false;
    let pressed = false;
    let pressedTimer = 0;
    let lastDrawn = { x: pointer.x, y: pointer.y };

    function draw() {
      // Nur den kleinen vorherigen Cursorbereich löschen. Ein Clear des
      // kompletten hochauflösenden Viewport-Canvas bei jeder Mausbewegung
      // konkurrierte beim wiederholten Kartenöffnen mit WebGL und SVG.
      ctx!.clearRect(lastDrawn.x - 28, lastDrawn.y - 28, 56, 56);
      if (!visible) return;

      ctx!.save();
      ctx!.translate(pointer.x, pointer.y);
      ctx!.rotate(-Math.PI / 4);
      ctx!.beginPath();
      ctx!.moveTo(0, 0);
      ctx!.lineTo(-8, 13);
      ctx!.moveTo(0, 0);
      ctx!.lineTo(8, 13);
      ctx!.strokeStyle = pressed ? '#f6e3a1' : '#ffffff';
      ctx!.lineWidth = 2.2;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';
      ctx!.shadowColor = pressed ? 'rgba(231,197,106,0.95)' : 'transparent';
      ctx!.shadowBlur = pressed ? 8 : 0;
      ctx!.stroke();
      ctx!.restore();
      ctx!.shadowBlur = 0;
      lastDrawn = { x: pointer.x, y: pointer.y };
    }

    function onMove(e: PointerEvent) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      visible = true;
      draw();
    }
    function onDown(e: PointerEvent) {
      onMove(e);
      pressed = true;
      draw();
      window.clearTimeout(pressedTimer);
      pressedTimer = window.setTimeout(() => {
        pressed = false;
        draw();
      }, 160);
    }
    function onLeave() { visible = false; draw(); }
    function onEnter() { visible = true; draw(); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('mouseenter', onEnter);

    return () => {
      window.clearTimeout(pressedTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mouseenter', onEnter);
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, [useCustomCursor]);

  if (!useCustomCursor) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 999999, pointerEvents: 'none' }}
    />
  );
}
