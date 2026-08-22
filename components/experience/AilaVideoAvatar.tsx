'use client';

import { useEffect, useRef, useState } from 'react';
import { readAilaAudioLevel } from './ailaAudioLevel';
import styles from './experience.module.css';

export type AilaVideoMode = 'idle' | 'attention' | 'thinking' | 'speaking' | 'cta';

const VIDEO_BY_MODE: Record<AilaVideoMode, string> = {
  // The attention clip's posture fits AILA floating/resting better than the
  // dedicated idle clip does, but looped as-is it repeats identically every
  // ~6s. This is that same clip at 2x speed followed by the same clip at 1x
  // speed reversed (v1, ~9s - ends back at the frame the 2x pass started
  // from), with that whole v1 pass appended once more at half speed (~18s)
  // right after itself for even more variation - the seam is jump-free
  // because v1 already starts and ends on the same frame, so its slowed
  // repeat picks up exactly where the first pass left off, and ends there
  // too.
  idle: '/cinematic/aila/aila-idle-attention-loop-v2-greenscreen.mp4',
  attention: '/cinematic/aila/aila-attention-v2-greenscreen.mp4',
  thinking: '/cinematic/aila/aila-thinking-v1-pingpong-greenscreen.mp4',
  // The idle clip's mouth-glow shimmer (a problem while merely resting, see
  // the idle-speed slowdown below) is exactly the motion actual speech
  // needs - reused here as the speaking clip instead of the dedicated one.
  speaking: '/cinematic/aila/aila-idle-v1-pingpong-greenscreen.mp4',
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
      // Ties her mouth-glow to the actual loudness of whatever is voicing
      // her right now (see ailaAudioLevel.ts) instead of the fixed loop's
      // own unrelated rhythm - not real lip-sync (she has no visemes to
      // switch between), but a brightness pulse that tracks the voice. A
      // cheap CSS filter on the whole canvas rather than more per-pixel
      // work in the already-expensive loop above.
      canvas.style.filter = mode === 'speaking' ? `brightness(${1 + readAilaAudioLevel() * .4})` : '';
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
    // The idle clip's mouth-glow shimmer reads as talking when looped at
    // full speed with nothing actually being said - slowed way down here so
    // it settles into a calm ambient pulse instead, while every other mode
    // keeps its natural pace.
    video.playbackRate = mode === 'idle' ? 0.3 : 1;
    void video.play().then(scheduleVideoFrame).catch(() => setVideoReady(false));

    return () => {
      stopped = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (videoFrame && typeof video.cancelVideoFrameCallback === 'function') video.cancelVideoFrameCallback(videoFrame);
      canvas.style.filter = '';
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
