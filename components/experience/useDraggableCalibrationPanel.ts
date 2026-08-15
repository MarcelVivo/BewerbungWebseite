'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

type PanelPosition = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function useDraggableCalibrationPanel(storageKey: string) {
  const panelRef = useRef<HTMLElementTagNameMap['aside'] | null>(null);
  const dragRef = useRef<null | { pointerId: number; offsetX: number; offsetY: number }>(null);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setPosition(JSON.parse(stored));
    } catch {
      // The panel remains draggable even when persistence is unavailable.
    }
  }, [storageKey]);

  useEffect(() => {
    if (!position) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(position));
    } catch {
      // The panel remains draggable even when persistence is unavailable.
    }
  }, [position, storageKey]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const panel = panelRef.current;
      const drag = dragRef.current;
      if (!panel || !drag || event.pointerId !== drag.pointerId) return;
      const bounds = panel.getBoundingClientRect();
      setPosition({
        x: clamp(event.clientX - drag.offsetX, 8, Math.max(8, window.innerWidth - bounds.width - 8)),
        y: clamp(event.clientY - drag.offsetY, 8, Math.max(8, window.innerHeight - bounds.height - 8)),
      });
    };
    const finish = (event: PointerEvent) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      dragRef.current = null;
      delete panelRef.current?.dataset.dragging;
    };
    const keepInViewport = () => {
      const panel = panelRef.current;
      if (!panel || !position) return;
      const bounds = panel.getBoundingClientRect();
      setPosition((current) => current ? {
        x: clamp(current.x, 8, Math.max(8, window.innerWidth - bounds.width - 8)),
        y: clamp(current.y, 8, Math.max(8, window.innerHeight - bounds.height - 8)),
      } : current);
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('resize', keepInViewport);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('resize', keepInViewport);
    };
  }, [position]);

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const panel = panelRef.current;
    if (!panel) return;
    event.preventDefault();
    const bounds = panel.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    panel.dataset.dragging = 'true';
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (!position) setPosition({ x: bounds.left, y: bounds.top });
  };

  return {
    panelRef,
    panelStyle: position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined,
    startDrag,
  };
}
