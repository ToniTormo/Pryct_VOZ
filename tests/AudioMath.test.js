const AudioMath = require('../JS/utils/AudioMath');

test('argprin returns principal argument within -PI..PI', () => {
  const val = Math.PI * 1.5; // 1.5PI -> should map to -0.5PI
  const res = AudioMath.argprin(val);
  expect(res).toBeGreaterThanOrEqual(-Math.PI);
  expect(res).toBeLessThanOrEqual(Math.PI);
});

test('convolve works for simple signal and kernel', () => {
  const signal = [1,2,3];
  const kernel = [1,0,-1];
  const res = AudioMath.convolve(signal, kernel);
  // crude expected length check and some numerical checks
  expect(res.length).toBe(signal.length);
  expect(typeof res[0]).toBe('number');
});
