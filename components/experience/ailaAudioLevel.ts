'use client';

// Shared, lightweight real-time loudness meter for whichever <audio>
// element is currently voicing AILA (the hero/station greetings in
// AilaGreeting.tsx, or a chat reply in AilaGuide.tsx) - read every render
// frame by AilaVideoAvatar.tsx (mobile) and ScrollEntity.tsx (desktop) to
// give her mouth-glow a subtle brightness pulse tied to the actual voice
// instead of an audio-independent fixed loop. Not real lip-sync (the
// character's mouth is a stylised glow pattern, not a set of visemes), but
// reacts to the voice's own loudness in real time.

let audioContext: AudioContext | null = null;
let activeAnalyser: AnalyserNode | null = null;
let smoothedLevel = 0;
const sampleBuffer = new Uint8Array(128);

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  return audioContext;
};

// Routes the element's output through an AnalyserNode for metering, then
// back out to the speakers - skipping the reconnect to `destination` would
// silently mute the element, since creating a MediaElementSourceNode
// redirects its output into the Web Audio graph. Safe to call once per
// fresh Audio() instance; each element can only ever get one such node, so
// this never touches a previously-metered element twice. Returns a cleanup
// function that detaches the meter (does not stop playback).
export function attachAilaAudioLevel(audio: HTMLAudioElement): () => void {
  const ctx = getAudioContext();
  if (!ctx) return () => undefined;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.55;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    activeAnalyser = analyser;
    return () => {
      if (activeAnalyser === analyser) { activeAnalyser = null; smoothedLevel = 0; }
      try { source.disconnect(); analyser.disconnect(); } catch { /* already torn down */ }
    };
  } catch {
    // Most likely this exact element already had a source node created for
    // it (shouldn't happen given how callers use it, but playback matters
    // far more than the glow effect) - leave it unmetered rather than risk
    // the audio itself.
    return () => undefined;
  }
}

// For the "Live" microphone conversation (WebRTC audio streamed straight
// from OpenAI, not a plain <audio src>) - a MediaStreamAudioSourceNode taps
// the stream without redirecting it, unlike createMediaElementSource above,
// so there's no destination reconnect needed and no risk of muting the
// element's own native playback.
export function attachAilaAudioLevelFromStream(stream: MediaStream): () => void {
  const ctx = getAudioContext();
  if (!ctx) return () => undefined;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.55;
    source.connect(analyser);
    activeAnalyser = analyser;
    return () => {
      if (activeAnalyser === analyser) { activeAnalyser = null; smoothedLevel = 0; }
      try { source.disconnect(); analyser.disconnect(); } catch { /* already torn down */ }
    };
  } catch {
    return () => undefined;
  }
}

// 0..1, exponentially smoothed so the glow eases rather than flickers.
// Decays toward 0 on its own once nothing is attached (or between words),
// rather than holding the last loud moment's brightness.
export function readAilaAudioLevel(): number {
  if (!activeAnalyser) {
    smoothedLevel *= 0.85;
    return smoothedLevel;
  }
  activeAnalyser.getByteTimeDomainData(sampleBuffer);
  let sumSquares = 0;
  for (let index = 0; index < sampleBuffer.length; index += 1) {
    const normalized = (sampleBuffer[index] - 128) / 128;
    sumSquares += normalized * normalized;
  }
  const rms = Math.sqrt(sumSquares / sampleBuffer.length);
  const target = Math.min(1, rms * 7);
  smoothedLevel = smoothedLevel * 0.6 + target * 0.4;
  return smoothedLevel;
}
