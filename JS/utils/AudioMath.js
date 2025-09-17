/* AudioMath.js
 * Pure mathematical helpers extracted from autotune.js
 * Exports: argprin, convolve, generarFrecuenciasNotas, frecuenciaMasCercana
 * UMD wrapper so it can be used in CommonJS, AMD and as a browser global (window.AudioMath)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node / CommonJS
    module.exports = factory();
  } else {
    // Browser global
    root.AudioMath = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Principal argument: normalize angle to (-PI, PI]
  function argprin(v) {
    while (v <= -Math.PI) v += 2 * Math.PI;
    while (v > Math.PI) v -= 2 * Math.PI;
    return v;
  }

  // Convolution of two real sequences (signal * kernel)
  function convolve(signal, kernel) {
    if (!Array.isArray(signal) || !Array.isArray(kernel)) {
      throw new TypeError('signal and kernel must be arrays');
    }
    var n = signal.length;
    var m = kernel.length;
    if (n === 0 || m === 0) return [];
    var out = new Array(n + m - 1);
    for (var i = 0; i < out.length; i++) out[i] = 0;
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < m; j++) {
        out[i + j] += signal[i] * kernel[j];
      }
    }
    return out;
  }

  // Generate an array of musical note frequencies between fmin and fmax (inclusive)
  // Uses A4 = 440 Hz, MIDI note 69. Returns sorted ascending frequencies.
  function generarFrecuenciasNotas(fmin, fmax) {
    if (typeof fmin !== 'number' || typeof fmax !== 'number') {
      throw new TypeError('fmin and fmax must be numbers');
    }
    if (fmin <= 0 || fmax <= 0) {
      throw new RangeError('fmin and fmax must be positive');
    }
    if (fmin > fmax) {
      var tmp = fmin; fmin = fmax; fmax = tmp;
    }
    var notas = [];
    // Convert frequency bounds to nearest MIDI note numbers relative to A4=440 (MIDI 69)
    var minN = Math.ceil(69 + 12 * Math.log2(fmin / 440));
    var maxN = Math.floor(69 + 12 * Math.log2(fmax / 440));
    for (var n = minN; n <= maxN; n++) {
      var freq = 440 * Math.pow(2, (n - 69) / 12);
      notas.push(freq);
    }
    return notas;
  }

  // Find nearest frequency in 'notas' to frequency f
  // Returns an object { index, frecuencia, diferencia }
  function frecuenciaMasCercana(f, notas) {
    if (typeof f !== 'number') throw new TypeError('f must be a number');
    if (!Array.isArray(notas) || notas.length === 0) return null;
    var bestIdx = 0;
    var bestDiff = Math.abs(f - notas[0]);
    for (var i = 1; i < notas.length; i++) {
      var d = Math.abs(f - notas[i]);
      if (d < bestDiff) {
        bestDiff = d;
        bestIdx = i;
      }
    }
    return { index: bestIdx, frecuencia: notas[bestIdx], diferencia: bestDiff };
  }

  // Export shape friendly for tests and consumers
  var exports = {
    argprin: argprin,
    convolve: convolve,
    generarFrecuenciasNotas: generarFrecuenciasNotas,
    frecuenciaMasCercana: frecuenciaMasCercana
  };

  return exports;
}));

// Ensure window.AudioMath is available in browser environments as requested
if (typeof window !== 'undefined') {
  try {
    if (typeof module !== 'undefined' && module.exports) {
      window.AudioMath = module.exports;
    } else if (typeof AudioMath !== 'undefined') {
      window.AudioMath = AudioMath;
    }
  } catch (e) {
    // ignore in environments where module is not writable
  }
}
