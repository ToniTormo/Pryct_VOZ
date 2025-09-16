/* AudioMath.js - utility math functions (UMD) */
(function(root) {
  const AM = {};

  AM.argprin = function(v) {
    // principal argument of v (wrap to -PI..PI)
    const w = ((Math.atan2(Math.sin(v), Math.cos(v)) + Math.PI) % (2 * Math.PI)) - Math.PI;
    return w;
  };

  AM.convolve = function(signal, kernel) {
    const result = [];
    const kernelSize = kernel.length;
    const signalSize = signal.length;
    for (let i = 0; i < signalSize; i++) {
      let sum = 0;
      for (let j = 0; j < kernelSize; j++) {
        const index = i - Math.floor(kernelSize / 2) + j;
        if (index >= 0 && index < signalSize) {
          sum += signal[index] * kernel[j];
        }
      }
      result.push(sum);
    }
    return result;
  };

  AM.generarFrecuenciasNotas = function(fmin, fmax) {
    const notas = [];
    let f = fmin;
    while (f <= fmax) {
      notas.push(f);
      f *= Math.pow(2, 1 / 12);
      // guard against infinite loops in weird numeric edge cases
      if (notas.length > 2000) break;
    }
    return notas;
  };

  AM.frecuenciaMasCercana = function(f, notas) {
    if (!notas || notas.length === 0) return f;
    let closest = notas[0];
    let minDiff = Math.abs(f - closest);
    for (let i = 1; i < notas.length; i++) {
      const diff = Math.abs(f - notas[i]);
      if (diff < minDiff) {
        closest = notas[i];
        minDiff = diff;
      }
    }
    return closest;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = AM; else root.AudioMath = AM;
})(this);
