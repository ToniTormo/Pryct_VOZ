const AudioMath = require('../JS/utils/AudioMath');
const { argprin, convolve, generarFrecuenciasNotas, frecuenciaMasCercana } = AudioMath;

test('argprin reduces angle to principal value', () => {
  expect(Number.isFinite(argprin(0))).toBeTruthy();
  const v = argprin(3 * Math.PI);
  // principal value should be +/- PI
  expect(Math.abs(Math.abs(v) - Math.PI) < 1e-6).toBeTruthy();
});

test('convolve basic', () => {
  const out = convolve([1, 2, 3], [1, 0]);
  expect(Array.isArray(out)).toBe(true);
  expect(out.length).toBe(3);
  expect(out[0]).toBeCloseTo(1);
  // check a center element for determinism
  expect(out[1]).toBeCloseTo(2);
});

test('generarFrecuenciasNotas and frecuenciaMasCercana', () => {
  const freqs = generarFrecuenciasNotas(440, 880);
  expect(Array.isArray(freqs)).toBe(true);
  expect(freqs.length).toBeGreaterThan(0);
  const nearest = frecuenciaMasCercana(660, freqs);
  expect(Number.isFinite(nearest)).toBeTruthy();
  // 660 may not be exactly in the semitone list; ensure nearest is reasonably close
  expect(Math.abs(nearest - 660)).toBeLessThanOrEqual(20);
});
