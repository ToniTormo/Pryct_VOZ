const SignalProcessing = require('../JS/utils/SignalProcessing');

test('segmentaf0 preserves constant pitch array', () => {
  const input = [440, 440, 440, 440];
  const output = SignalProcessing.segmentaf0(input, 3, 1, 50); // Use M=3, D=1, umbral=50
  expect(output.length).toBe(input.length);
  expect(output.every((v, i) => Math.abs(v - input[i]) < 1e-9)).toBeTruthy();
});
