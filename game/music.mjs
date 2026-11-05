// Original procedural composition: “After Class”, 72 BPM, Cmaj9–Am9–Fmaj9–G6.
// This file and its generated musical composition are dedicated under CC0-1.0.
export function createMusic() {
  let context, master, timer, next = 0, beat = 0, volume = .45;
  const chords = [[48,55,59,62,64],[45,52,55,59,60],[41,48,52,55,57],[43,50,55,57,59]];
  function tone(midi, time, length, level, soft = false) {
    const oscillator = context.createOscillator(), envelope = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = soft ? 'sine' : 'triangle';
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    filter.type = 'lowpass'; filter.frequency.value = soft ? 800 : 1600;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level, time + .035);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + length);
    oscillator.connect(filter); filter.connect(envelope); envelope.connect(master);
    oscillator.start(time); oscillator.stop(time + length + .05);
    oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); envelope.disconnect(); };
  }
  function schedule() {
    if (!context || context.state !== 'running') return;
    while (next < context.currentTime + .3) {
      const chord = chords[Math.floor(beat / 16) % 4], position = beat % 16;
      if (position % 4 === 0) chord.slice(1).forEach((note, i) => tone(note, next + i * .025, 2.9, .025, true));
      if (position % 4 === 0) tone(chord[0] - 12, next, .85, .085, true);
      const pattern = [0,2,1,3,2,1,4,2];
      if (position % 2 === 0) tone(chord[pattern[(position / 2) % 8]] + 12, next + .035, 1.05, .035);
      next += 60 / 72 / 2; beat++;
    }
  }
  return {
    async setEnabled(enabled) {
      if (!enabled) { if (master && context) master.gain.setTargetAtTime(0, context.currentTime, .12); clearInterval(timer); timer = null; return; }
      try {
        if (!context) { context = new (window.AudioContext || window.webkitAudioContext)(); master = context.createGain(); master.gain.value = 0; master.connect(context.destination); }
        await context.resume();
        master.gain.setTargetAtTime(volume, context.currentTime, .25);
        if (!timer) { next = context.currentTime + .06; schedule(); timer = setInterval(schedule, 100); }
      } catch { /* Text and gameplay remain available without audio support. */ }
    },
    setVolume(value) { volume = Math.max(0, Math.min(1, Number(value))); if (master && timer) master.gain.setTargetAtTime(volume, context.currentTime, .1); }
  };
}
