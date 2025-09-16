const path = require('path');
const AM = require(path.resolve(__dirname, '../JS/utils/AudioMath.js'));
const SP = require(path.resolve(__dirname, '../JS/utils/SignalProcessing.js'));

test('segmentaf0 a simple smoothing example (keeps length)', () => {
  const input = [100, 110, 0, 0, 120, 125];
  const output = SP.segmentaf0(input, 3, 2, 20);
  expect(output.length).toBe(input.length);
  // Values should remain numbers (not undefined)
  output.forEach(v => expect(typeof v === 'number').toBeTruthy());
});

// Test that autotune returns the same buffer (per SignalProcessing.autotune placeholder)
test('autotune placeholder returns input buffer', () => {
  const fakeBuffer = { sampleRate: 44100, length: 10, numberOfChannels: 1 };
  const out = SP.autotune(fakeBuffer, AM);
  expect(out).toBe(fakeBuffer);
});
