(function (global) {
  const AudioMath = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./AudioMath') : global.AudioMath;
  const SignalProcessing = {};

  // Provide a simple helper that performs 'closest note' quantization using AudioMath (keeps original behavior split)
  SignalProcessing.closestNoteForFrequency = function (f, fmin, fmax) {
    const notas = AudioMath.generarFrecuenciasNotas(fmin, fmax);
    return AudioMath.frecuenciaMasCercana(f, notas);
  };

  // Placeholders for heavier functions (trajectory, segmentation) - keep minimal shell so other code can import
  SignalProcessing.autotune = function (audioBuffer) {
    // Original autotune pipeline was very heavy (depends on numeric/librosa). Keep compatibility by returning the original buffer
    // or by acting as a thin wrapper. To preserve behavior without external libs, return the input buffer.
    return audioBuffer;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SignalProcessing;
  if (typeof global !== 'undefined') global.SignalProcessing = SignalProcessing;
}(typeof window !== 'undefined' ? window : global));
