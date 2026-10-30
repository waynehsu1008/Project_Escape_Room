// Original procedural interaction sounds. Code and generated sounds: CC0-1.0.
export function actionSound(action, result, before) {
  if (!result.ok) return ['SOLVE', 'USE', 'PICKUP', 'ANSWER', 'TRAVEL'].includes(action.type) ? 'error' : null;
  const after = result.state;
  if (action.type === 'SOLVE' && after.solved.length > before.solved.length) return 'success';
  if (action.type === 'PICKUP' && after.inventory.length > before.inventory.length) return 'pickup';
  if (action.type === 'USE' && after.used.length > before.used.length) return action.id === 'I03' ? 'unlock' : 'place';
  if (action.type === 'TRAVEL' && (before.scene !== after.scene || before.ended !== after.ended)) return after.ended ? 'ending' : 'door';
  if (action.type === 'ANSWER' && !before.flags.exitOpen && after.flags.exitOpen) return 'success';
  if (action.type === 'HINT') return 'paper';
  return null;
}

const sounds = {
  click: [[740, .0, .045, .025, 490]],
  paper: [[960, 0, .06, .012, 700], [680, .045, .075, .012, 420]],
  pickup: [[659, 0, .12, .055], [988, .085, .19, .04]],
  place: [[240, 0, .1, .05, 145], [460, .07, .12, .025]],
  unlock: [[1600, 0, .035, .025], [2200, .04, .055, .025], [190, .12, .18, .065, 85]],
  door: [[120, 0, .18, .075, 75], [235, .11, .34, .025, 155], [90, .36, .13, .045, 55]],
  success: [[523, 0, .22, .045], [659, .09, .25, .04], [784, .18, .4, .04]],
  error: [[220, 0, .11, .035, 185], [165, .12, .17, .025, 140]],
  ending: [[523, 0, .5, .035], [659, .12, .6, .035], [784, .24, .7, .03], [1047, .4, .9, .025]]
};
export function createEffects() {
  let context, enabled = false, noise;
  const active = new Set(), last = new Map();
  function clear() { for (const node of active) { try { node.stop(); } catch {} } active.clear(); }
  function track(node) { active.add(node); node.addEventListener('ended', () => { active.delete(node); node.disconnect(); }, { once: true }); }
  return {
    setEnabled(value) { enabled = Boolean(value); if (!enabled) clear(); },
    play(name) {
      if (!enabled || !sounds[name] || document.hidden) return;
      const stamp = performance.now();
      if (stamp - (last.get(name) ?? -Infinity) < (name === 'click' ? 45 : 100)) return;
      last.set(name, stamp);
      try {
        context ||= new (window.AudioContext || window.webkitAudioContext)();
        context.resume().catch(() => {});
        const start = context.currentTime + .005;
        for (const [frequency, delay, length, volume, endFrequency] of sounds[name]) {
          const oscillator = context.createOscillator(), gain = context.createGain();
          oscillator.type = ['door', 'unlock', 'place'].includes(name) ? 'triangle' : 'sine';
          oscillator.frequency.setValueAtTime(frequency, start + delay);
          if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + delay + length);
          gain.gain.setValueAtTime(.0001, start + delay);
          gain.gain.linearRampToValueAtTime(volume, start + delay + .008);
          gain.gain.exponentialRampToValueAtTime(.0001, start + delay + length);
          oscillator.connect(gain); gain.connect(context.destination); track(oscillator);
          oscillator.addEventListener('ended', () => gain.disconnect(), { once: true });
          oscillator.start(start + delay); oscillator.stop(start + delay + length + .01);
        }
        if (['door', 'paper', 'unlock'].includes(name)) {
          if (!noise) {
            noise = context.createBuffer(1, context.sampleRate * .4, context.sampleRate);
            const data = noise.getChannelData(0); let seed = 1958;
            for (let i = 0; i < data.length; i++) { seed = (seed * 16807) % 2147483647; data[i] = seed / 1073741824 - 1; }
          }
          const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
          source.buffer = noise; filter.type = 'lowpass'; filter.frequency.value = name === 'paper' ? 3200 : 650;
          gain.gain.setValueAtTime(.025, start); gain.gain.exponentialRampToValueAtTime(.0001, start + .22);
          source.connect(filter); filter.connect(gain); gain.connect(context.destination); track(source);
          source.addEventListener('ended', () => { filter.disconnect(); gain.disconnect(); }, { once: true });
          source.start(start); source.stop(start + .25);
        }
      } catch { /* Sound is optional; gameplay remains fully usable. */ }
    }
  };
}
