const AudioMath = require('../JS/utils/AudioMath');

test('argprin reduces angles into [-PI, PI]', () => {
  const ans = AudioMath.argprin(Math.PI * 1.5);
  // expected value: (1.5PI) normalized -> -0.5PI
  expect(Number(ans.toFixed(6))).toBeCloseTo(-Math.PI/2, 6);
});

test('convolve simple signal', () => {
  const sig = [1,2,3];
  const kern = [1,0,-1];
  const out = AudioMath.convolve(sig, kern);
  // simple check that it returns an array of same length
  expect(out.length).toBe(sig.length);
  // Known convolution result (hand-check crude expectations)
  expect(typeof out[0]).toBe('number');
});
