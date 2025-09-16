const AudioMath = require('../JS/utils/AudioMath');

test('argprin returns principal argument in range [-PI,PI]', () => {
  const val = AudioMath.argprin(Math.PI * 1.2);
  expect(val).toBeGreaterThanOrEqual(-Math.PI);
  expect(val).toBeLessThanOrEqual(Math.PI);
});

test('convolve with unit kernel returns original signal', () => {
  const s = [1, 2, 3, 4];
  const k = [1];
  expect(AudioMath.convolve(s, k)).toEqual([1, 2, 3, 4]);
});

test('generarFrecuenciasNotas returns increasing semitone steps', () => {
  const freqs = AudioMath.generarFrecuenciasNotas(440, 880);
  expect(freqs[0]).toBeCloseTo(440);
  expect(freqs[1]).toBeCloseTo(440 * Math.pow(2, 1/12));
});
