// A soft, low bell tone synthesized on demand, so no audio file is needed.
let context = null;

export function playChime() {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') context.resume();
    const now = context.currentTime;
    const output = context.createGain();
    const filter = context.createBiquadFilter();
    // A gentle low-pass keeps the strike warm instead of piercing.
    filter.type = 'lowpass'; filter.frequency.value = 1800; filter.Q.value = .4;
    output.gain.setValueAtTime(.0001, now);
    output.gain.exponentialRampToValueAtTime(.22, now + .012);
    output.gain.exponentialRampToValueAtTime(.0001, now + 2.4);
    filter.connect(output); output.connect(context.destination);
    // Fundamental near G4 with quiet, slightly inharmonic overtones like a small bell.
    for (const [ratio, level, decay] of [[1, 1, 2.4], [2.01, .28, 1.4], [2.76, .12, .9], [.5, .18, 2]]) {
      const tone = context.createOscillator(), gain = context.createGain();
      tone.type = 'sine'; tone.frequency.value = 392 * ratio;
      gain.gain.setValueAtTime(level, now);
      gain.gain.exponentialRampToValueAtTime(.0001, now + decay);
      tone.connect(gain); gain.connect(filter);
      tone.start(now); tone.stop(now + decay + .05);
    }
  } catch (error) {
    console.warn('Bell chime unavailable', error);
  }
}
