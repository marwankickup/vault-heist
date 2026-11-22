// Sound, generated in code with WebAudio: no audio files, no network.
// A soft blip for loot, a rising two-tone warn while the alarm climbs,
// a low sting for getting caught, a heavy clunk for the cracked vault.
export function createAudio() {
  let context = null;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (!context) {
      try {
        context = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') void context.resume();
    return context;
  }

  function blip(freq, seconds, type = 'sine', gain = 0.08) {
    const ctx = ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  }

  return {
    unlock() { ensure(); },
    loot() { blip(880, 0.12); setTimeout(() => blip(1320, 0.14), 60); },
    vault() { blip(180, 0.25, 'square', 0.1); setTimeout(() => blip(90, 0.35, 'square', 0.12), 120); },
    coin() { blip(1560, 0.07, 'triangle', 0.06); },
    click() { blip(660, 0.05, 'triangle', 0.05); },
    caught() {
      blip(220, 0.4, 'sawtooth', 0.12);
      setTimeout(() => blip(110, 0.6, 'sawtooth', 0.12), 150);
    },
    win() {
      [523, 659, 784, 1047].forEach((freq, i) => setTimeout(() => blip(freq, 0.2), i * 110));
    },
    // The alarm drone follows the meter: silent when calm, urgent near 100.
    setAlarmLevel(level) {
      const ctx = ensure();
      if (!ctx) return;
      if (level <= 0.25) {
        if (alarmOsc) { try { alarmOsc.stop(); } catch { /* already stopped */ } alarmOsc = null; }
        return;
      }
      if (!alarmOsc) {
        alarmOsc = ctx.createOscillator();
        alarmGain = ctx.createGain();
        alarmOsc.type = 'triangle';
        alarmOsc.connect(alarmGain).connect(ctx.destination);
        alarmOsc.start();
      }
      alarmOsc.frequency.value = 160 + level * 320;
      alarmGain.gain.value = 0.015 + level * 0.05;
    },
  };
}
