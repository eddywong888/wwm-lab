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

export function playMatch(streak: number = 1) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  let notes: number[] = [];
  let noteDelay = 0.06;
  let noteDuration = 0.35;
  const type: OscillatorType = 'triangle';

  if (streak === 1) {
    notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  } else if (streak === 2) {
    notes = [329.63, 392.00, 493.88, 659.25]; // E4, G4, B4, E5 (Bright major arpeggio)
    noteDelay = 0.05;
  } else if (streak === 3) {
    notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C4, D4, E4, G4, A4, C5 (Pentatonic rise)
    noteDelay = 0.04;
  } else {
    // Streak >= 4 (Mega Streak)
    notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6 (Full arpeggio run)
    noteDelay = 0.035;
    noteDuration = 0.45;
  }

  const time = ctx.currentTime;

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time + index * noteDelay);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.08, time + index * noteDelay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + index * noteDelay + noteDuration);

    osc.start(time + index * noteDelay);
    osc.stop(time + index * noteDelay + noteDuration + 0.1);
  });

  // For streak >= 4, play a harmonized final chord on top of the arpeggio
  if (streak >= 4) {
    const chordNotes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const chordTime = time + notes.length * noteDelay + 0.05;
    chordNotes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, chordTime);

      gain.gain.setValueAtTime(0, chordTime);
      gain.gain.linearRampToValueAtTime(0.06, chordTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.6);

      osc.start(chordTime);
      osc.stop(chordTime + 0.7);
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
