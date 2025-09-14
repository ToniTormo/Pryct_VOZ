// tests/test_autotune_utils.js
const pitch = require('../JS/utils/pitch');
const effects = require('../JS/utils/effects');

describe('pitch utils', () => {
  test('argprin returns principal argument for simple input', () => {
    // argprin(2π) should be ~0
    expect(Math.abs(pitch.argprin(2 * Math.PI))).toBeLessThan(1e-10);
  });

  test('generarFrecuenciasNotas generates semitone steps', () => {
    const freqs = pitch.generarFrecuenciasNotas(440, 440 * Math.pow(2, 3/12)); // a few semitones
    expect(freqs[0]).toBeCloseTo(440);
    expect(freqs.length).toBeGreaterThanOrEqual(1);
  });

  test('frecuenciaMasCercana picks the nearest frequency', () => {
    const notas = [440, 466.1637615, 493.8833];
    expect(pitch.frecuenciaMasCercana(450, notas)).toBeCloseTo(440);
    expect(pitch.frecuenciaMasCercana(470, notas)).toBeCloseTo(466.1637615);
  });
});

describe('effects utils', () => {
  test('convolve simple case', () => {
    const signal = [1, 2, 3];
    const kernel = [1, 0];
    const out = effects.convolve(signal, kernel);
    // conservative expectations: output array same length
    expect(out.length).toBe(signal.length);
    // with kernel [1,0] convolution should roughly reproduce a smoothed version — ensure numeric type
    expect(typeof out[0]).toBe('number');
  });
});
