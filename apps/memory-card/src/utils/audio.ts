let isMuted = false;
try {
  isMuted = localStorage.getItem('memory_card_muted') === 'true';
} catch (e) {
  // Ignore localStorage security/unavailability issues
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  try {
    localStorage.setItem('memory_card_muted', String(isMuted));
  } catch (e) {}
  return isMuted;
}

export function getMuteState(): boolean {
  return isMuted;
}

export function playFlip() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

export function playMatch() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.06);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + index * 0.06 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.06 + 0.35);

    osc.start(ctx.currentTime + index * 0.06);
    osc.stop(ctx.currentTime + index * 0.06 + 0.45);
  });
}

export function playMismatch() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  // Simple lowpass filter to make it less harsh
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, ctx.currentTime);
  
  osc.disconnect(gain);
  osc.connect(filter);
  filter.connect(gain);

  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

export function playVictory() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const melody = [
    { freq: 261.63, duration: 0.1 }, // C4
    { freq: 329.63, duration: 0.1 }, // E4
    { freq: 392.00, duration: 0.1 }, // G4
    { freq: 523.25, duration: 0.15 }, // C5
    { freq: 392.00, duration: 0.1 }, // G4
    { freq: 523.25, duration: 0.3 }  // C5
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
    gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + note.duration);

    osc.start(time);
    osc.stop(time + note.duration + 0.05);

    time += note.duration * 0.9;
  });
}
