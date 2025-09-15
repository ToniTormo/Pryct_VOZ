const SignalProcessing = require('../JS/utils/SignalProcessing');

test('segmentaf0 returns array of same length as input', () => {
  const input = [0, 100, 200, 0, 300, 310, 0];
  const out = SignalProcessing.segmentaf0(input, 3, 2, 50);
  expect(Array.isArray(out)).toBe(true);
  expect(out.length).toBe(input.length);
});
