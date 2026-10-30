// Original After Class composition and this renderer: CC0-1.0.
import { mkdir, writeFile } from 'node:fs/promises';
const rate = 44100, interval = 60 / 72 / 2, duration = 64 * interval + 3;
const samples = new Float32Array(Math.ceil(duration * rate));
const chords = [[48,55,59,62,64],[45,52,55,59,60],[41,48,52,55,57],[43,50,55,57,59]];
function note(midi, start, length, level, soft = false) {
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  for (let i = 0; i < length * rate; i++) {
    const index = Math.round(start * rate) + i;
    if (index >= samples.length) break;
    const t = i / rate, phase = 2 * Math.PI * frequency * t;
    const wave = Math.sin(phase) + (soft ? 0 : Math.sin(3 * phase) / 18);
    const envelope = t < .035 ? t / .035 : Math.exp(Math.log(.0001 / level) * (t - .035) / (length - .035));
    samples[index] += wave * level * envelope * .45;
  }
}
for (let beat = 0; beat < 64; beat++) {
  const chord = chords[Math.floor(beat / 16)], position = beat % 16, time = beat * interval;
  if (position % 4 === 0) { chord.slice(1).forEach((n, i) => note(n, time + i * .025, 2.9, .025, true)); note(chord[0] - 12, time, .85, .085, true); }
  if (position % 2 === 0) note(chord[[0,2,1,3,2,1,4,2][position / 2]] + 12, time + .035, 1.05, .035);
}
const buffer = Buffer.alloc(44 + samples.length * 2);
buffer.write('RIFF'); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8);
buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
buffer.write('data', 36); buffer.writeUInt32LE(samples.length * 2, 40);
samples.forEach((sample, i) => buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), 44 + i * 2));
await mkdir(new URL('../assets/audio/', import.meta.url), { recursive: true });
await writeFile(new URL('../assets/audio/after-class-preview.wav', import.meta.url), buffer);
console.log(`Rendered ${duration.toFixed(2)} seconds, ${buffer.length} bytes`);
