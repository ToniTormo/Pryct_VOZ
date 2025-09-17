const SignalProcessing = require('../JS/utils/SignalProcessing');

test('segmentaf0 handles trivial input', () => {
  const input = [440,440,0,0,440];
  const out = SignalProcessing.segmentaf0(input, 3, 3, 10);
  expect(Array.isArray(out)).toBe(true);
  expect(out.length).toBe(input.length);
});

test('modificaPitch passthrough returns array', () => {
  const xin = new Float32Array(1024).map(() => Math.random()*2-1);
  const res = SignalProcessing.modificaPitch(xin, 44100, 1024, 512, new Array(2).fill(0), new Array(2).fill(0), 100);
  expect(res).toBeDefined();
});
