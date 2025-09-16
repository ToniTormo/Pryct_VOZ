const path = require('path');
const AM = require(path.resolve(__dirname, '../JS/utils/AudioMath.js'));

test('argprin returns value within -PI..PI', () => {
  const out = AM.argprin(4.5); // arbitrary
  expect(out).toBeLessThanOrEqual(Math.PI);
  expect(out).toBeGreaterThanOrEqual(-Math.PI);
});

test('convolve simple kernel', () => {
  const sig = [1, 2, 3];
  const ker = [1, 0];
  const conv = AM.convolve(sig, ker);
  // With kernel [1,0] and center convention used in function, result[0] should equal 1, result[1] approx 2
  expect(conv[0]).toBeCloseTo(1);
  expect(conv[1]).toBeCloseTo(2);
});

test('generarFrecuenciasNotas returns semitone progression', () => {
  const f1 = 440;
  const f2 = Math.pow(2, 1/12) * 440;
  const arr = AM.generarFrecuenciasNotas(f1, f2);
  expect(arr.length).toBeGreaterThanOrEqual(2);
  expect(arr[0]).toBeCloseTo(440);
  expect(arr[1]).toBeCloseTo(f2);
});
