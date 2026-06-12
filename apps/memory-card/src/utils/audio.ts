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

function playNoiseBurst(ctx: AudioContext, startTime: number, volume: number, duration: number) {
  const bufferSize = Math.ceil(ctx.sampleRate * (duration + 0.05));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, startTime);
  filter.frequency.exponentialRampToValueAtTime(3500, startTime + duration * 0.25);
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(startTime);
  noise.stop(startTime + duration + 0.05);
}

function playAscendingRun(
  ctx: AudioContext,
  time: number,
  notes: number[],
  noteDelay: number,
  noteDuration: number,
  peakGain: number,
  type: OscillatorType = 'triangle',
) {
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time + i * noteDelay);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peakGain, time + i * noteDelay + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, time + i * noteDelay + noteDuration);
    osc.start(time + i * noteDelay);
    osc.stop(time + i * noteDelay + noteDuration + 0.05);
  });
}

export function playMatch(streak: number = 1) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const time = ctx.currentTime;

  if (streak === 1) {
    // Clean 3-note bell chime — pleasant, understated
    playAscendingRun(ctx, time, [523.25, 659.25, 783.99], 0.07, 0.4, 0.09, 'sine');

  } else if (streak === 2) {
    // Brighter 4-note ascending chime, faster
    playAscendingRun(ctx, time, [659.25, 783.99, 987.77, 1318.51], 0.055, 0.38, 0.09, 'sine');

  } else if (streak === 3) {
    // Fast pentatonic run + noise whoosh + sustained chord — noticeably more exciting
    const run = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51]; // C5 → E6 pentatonic
    const noteDelay = 0.038;
    playAscendingRun(ctx, time, run, noteDelay, 0.32, 0.11, 'triangle');

    // Noise whoosh starting just before the run ends
    playNoiseBurst(ctx, time + run.length * noteDelay * 0.5, 0.1, 0.45);

    // Sustained bright chord landing after run
    const chordTime = time + run.length * noteDelay + 0.04;
    [783.99, 987.77, 1318.51].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chordTime);
      gain.gain.setValueAtTime(0, chordTime);
      gain.gain.linearRampToValueAtTime(0.08, chordTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.7);
      osc.start(chordTime); osc.stop(chordTime + 0.8);
    });

  } else {
    // Streak ≥ 4 — MEGA: rapid run to high C + vibrato finale + big noise burst + full chord
    const run = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51]; // C4 → E6
    const noteDelay = 0.032;
    playAscendingRun(ctx, time, run, noteDelay, 0.35, 0.12, 'triangle');

    // Vibrato on the final held note
    const lastNoteTime = time + (run.length - 1) * noteDelay;
    const vib = ctx.createOscillator();
    const vibGain = ctx.createGain();
    const vibOsc = ctx.createOscillator();
    const vibFinal = ctx.createGain();
    vib.frequency.value = 7;
    vibGain.gain.value = 30;
    vib.connect(vibGain);
    vibOsc.type = 'sine';
    vibOsc.frequency.setValueAtTime(1318.51, lastNoteTime);
    vibGain.connect(vibOsc.frequency);
    vibOsc.connect(vibFinal);
    vibFinal.connect(ctx.destination);
    vibFinal.gain.setValueAtTime(0, lastNoteTime);
    vibFinal.gain.linearRampToValueAtTime(0.1, lastNoteTime + 0.03);
    vibFinal.gain.exponentialRampToValueAtTime(0.001, lastNoteTime + 0.75);
    vib.start(lastNoteTime); vib.stop(lastNoteTime + 0.8);
    vibOsc.start(lastNoteTime); vibOsc.stop(lastNoteTime + 0.8);

    // Big noise burst — crowd cheer feel
    playNoiseBurst(ctx, time + run.length * noteDelay * 0.4, 0.18, 0.65);

    // Full triumphant chord
    const chordTime = time + run.length * noteDelay + 0.04;
    [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chordTime);
      gain.gain.setValueAtTime(0, chordTime);
      gain.gain.linearRampToValueAtTime(0.09, chordTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.9);
      osc.start(chordTime); osc.stop(chordTime + 1.0);
    });
  }
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
