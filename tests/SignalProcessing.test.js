const SignalProcessing = require('../JS/utils/SignalProcessing');

test('closestNoteForFrequency picks nearest generated note', () => {
  const fmin = 440; // A4
  const fmax = 880;
  const target = 460; // should be mapped to something near 440
  const closest = SignalProcessing.closestNoteForFrequency(target, fmin, fmax);
  expect(Math.abs(closest - 440)).toBeLessThanOrEqual(Math.abs(closest - 880));
});

test('autotune returns the input when full pipeline not available', () => {
  const fakeBuffer = { test: 'buffer' };
  const out = SignalProcessing.autotune(fakeBuffer);
  expect(out).toBe(fakeBuffer);
});
