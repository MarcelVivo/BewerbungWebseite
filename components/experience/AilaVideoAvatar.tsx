'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './experience.module.css';

export type AilaVideoMode = 'idle' | 'attention' | 'thinking' | 'speaking' | 'cta';

const VIDEO_BY_MODE: Record<AilaVideoMode, string> = {
  idle: '/cinematic/aila/aila-idle-v1-pingpong-greenscreen.mp4',
  attention: '/cinematic/aila/aila-attention-v2-greenscreen.mp4',
  thinking: '/cinematic/aila/aila-thinking-v1-pingpong-greenscreen.mp4',
  speaking: '/cinematic/aila/aila-speaking-v1-greenscreen.mp4',
  cta: '/cinematic/aila/aila-cta-v1-greenscreen.mp4',
};

const FALLBACK_IMAGE = '/cinematic/aila/aila-idle-v1-fallback-transparent.png';

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const progress = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return progress * progress * (3 - 2 * progress);
};

export default function AilaVideoAvatar({ mode, alt = 'AILA' }: { mode: AilaVideoMode; alt?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setVideoReady(false);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause();
      return;
    }

    const context = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!context) return;

    canvas.width = 384;
    canvas.height = 216;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    let stopped = false;
    let animationFrame = 0;
    let videoFrame = 0;
    let firstFrame = true;
    let lastRenderedAt = 0;

    const renderFrame = (timestamp = performance.now()) => {
      if (stopped || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      if (timestamp - lastRenderedAt < 42) return;
      lastRenderedAt = timestamp;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = frame.data;

      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const strongestNonGreen = Math.max(red, blue);
        const greenDominance = green - strongestNonGreen;
        const alpha = 1 - smoothstep(38, 122, greenDominance);

        if (greenDominance > 8) pixels[index + 1] = Math.min(green, strongestNonGreen * 1.1 + 7);
        pixels[index + 3] = Math.round(pixels[index + 3] * alpha);
      }

      context.putImageData(frame, 0, 0);
      if (firstFrame) {
        firstFrame = false;
        setVideoReady(true);
      }
    };

    const scheduleVideoFrame = () => {
      if (stopped) return;
      if (typeof video.requestVideoFrameCallback === 'function') {
        videoFrame = video.requestVideoFrameCallback((timestamp) => {
          renderFrame(timestamp);
          scheduleVideoFrame();
        });
        return;
      }
      const renderLoop = (timestamp: number) => {
        renderFrame(timestamp);
        if (!stopped) animationFrame = window.requestAnimationFrame(renderLoop);
      };
      animationFrame = window.requestAnimationFrame(renderLoop);
    };

    video.src = VIDEO_BY_MODE[mode];
    video.load();
    void video.play().then(scheduleVideoFrame).catch(() => setVideoReady(false));

    return () => {
      stopped = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (videoFrame && typeof video.cancelVideoFrameCallback === 'function') video.cancelVideoFrameCallback(videoFrame);
      video.pause();
    };
  }, [mode]);

  return (
    <span className={styles.ailaAvatarMedia} data-mode={mode} data-video-ready={videoReady ? 'true' : 'false'}>
      <img className={styles.ailaAvatarFallback} src={FALLBACK_IMAGE} alt={alt} />
      <canvas ref={canvasRef} className={styles.ailaAvatarVideoCanvas} aria-hidden="true" />
      <video ref={videoRef} className={styles.ailaAvatarVideoSource} muted loop playsInline preload="metadata" aria-hidden="true" />
    </span>
  );
}
