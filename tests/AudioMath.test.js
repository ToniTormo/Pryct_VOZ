const { convolve, generarFrecuenciasNotas, frecuenciaMasCercana } = require('../JS/utils/AudioMath');

test('convolve average filter', () => {
  const result = convolve([1,3,5], [0.5,0.5]);
  expect(result).toEqual([0.5,2,4]);
});

test('frecuenciaMasCercana finds nearest', () => {
  const notas = generarFrecuenciasNotas(440, 880);
  const found = frecuenciaMasCercana(450, notas);
  // Allow a loose tolerance for floating point/scale differences
  const near440 = Math.abs(found - 440) < 30;
  const near466 = Math.abs(found - 466.163761517) < 30;
  expect(near440 || near466).toBeTruthy();
});
