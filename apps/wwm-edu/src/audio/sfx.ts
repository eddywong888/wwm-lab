// Procedural WebAudio sound effects, following the pattern used by
// apps/memory-card/src/utils/audio.ts: a lazily-created/resumed AudioContext,
// oscillator + gain envelopes, no audio asset files.

import { loadState, updateState } from '../store/local';

let muted = loadState().muted;
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Call on first user gesture (e.g. first tap) to unlock audio on mobile Safari. */
export function unlockAudio(): void {
  getAudioContext();
}

export function setMuted(next: boolean): void {
  muted = next;
  updateState({ muted: next });
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

export function playButtonTap(): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const time = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, time);
  gain.gain.setValueAtTime(0.05, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
  osc.start(time);
  osc.stop(time + 0.07);
}

export function playCorrectDing(): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const time = ctx.currentTime;
  const notes = [659.25, 987.77]; // E5 -> B5, quick bright interval
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    const t = time + i * 0.09;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.35);
  });
}

export function playWrongBuzz(): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const time = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(90, time + 0.28);
  gain.gain.setValueAtTime(0.08, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  osc.start(time);
  osc.stop(time + 0.32);
}

export function playSessionFanfare(): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const melody = [
    { freq: 523.25, duration: 0.12 }, // C5
    { freq: 659.25, duration: 0.12 }, // E5
    { freq: 783.99, duration: 0.12 }, // G5
    { freq: 1046.5, duration: 0.35 }, // C6
  ];
  let time = ctx.currentTime;
  melody.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.13, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + note.duration);
    osc.start(time);
    osc.stop(time + note.duration + 0.05);
    time += note.duration * 0.85;
  });
}
