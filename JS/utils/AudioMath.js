/**
 * AudioMath.js
 * Pure mathematical helpers extracted from autotune.js for reuse and testing.
 */

/**
 * Reduce angle to the principal argument in the interval (-PI, PI].
 * @param {number} x Angle in radians
 * @returns {number} Principal argument in radians between -PI and PI
 */
function argprin(x) {
  var twoPi = 2 * Math.PI;
  // Use modulo-like reduction but handle negatives properly
  var y = x % twoPi;
  if (y <= -Math.PI) {
    y += twoPi;
  } else if (y > Math.PI) {
    y -= twoPi;
  }
  return y;
}

/**
 * Convolve two real sequences (arrays or typed arrays).
 * Standard discrete linear convolution producing length = a.length + b.length - 1.
 * @param {Array|TypedArray} a
 * @param {Array|TypedArray} b
 * @returns {Float64Array} Convolved sequence
 */
function convolve(a, b) {
  var na = a.length | 0;
  var nb = b.length | 0;
  if (na === 0 || nb === 0) return new Float64Array(0);
  var n = na + nb - 1;
  var out = new Float64Array(n);
  for (var i = 0; i < na; i++) {
    var ai = +a[i];
    for (var j = 0; j < nb; j++) {
      out[i + j] += ai * +b[j];
    }
  }
  return out;
}

/**
 * Generate an array of frequencies for MIDI note numbers in a given range.
 * Uses equal temperament with A4 = 440 Hz.
 * @param {number} [minMidi=0] Minimum MIDI note number (inclusive)
 * @param {number} [maxMidi=127] Maximum MIDI note number (inclusive)
 * @returns {Float64Array} Frequencies for MIDI notes from minMidi to maxMidi
 */
function generarFrecuenciasNotas(minMidi, maxMidi) {
  if (typeof minMidi === 'undefined' || minMidi === null) minMidi = 0;
  if (typeof maxMidi === 'undefined' || maxMidi === null) maxMidi = 127;
  minMidi = Math.max(0, Math.floor(minMidi));
  maxMidi = Math.min(127, Math.floor(maxMidi));
  if (maxMidi < minMidi) {
    // return empty array if invalid range
    return new Float64Array(0);
  }
  var len = maxMidi - minMidi + 1;
  var freqs = new Float64Array(len);
  for (var m = minMidi; m <= maxMidi; m++) {
    freqs[m - minMidi] = 440 * Math.pow(2, (m - 69) / 12);
  }
  return freqs;
}

/**
 * Find the closest frequency in an array to a given frequency.
 * @param {number} freq Target frequency
 * @param {Array|TypedArray} freqs Array of candidate frequencies
 * @returns {{index: number, frequency: number, distance: number}} Closest entry info
 */
function frecuenciaMasCercana(freq, freqs) {
  var bestIdx = -1;
  var bestDist = Infinity;
  for (var i = 0; i < freqs.length; i++) {
    var d = Math.abs(freqs[i] - freq);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  if (bestIdx === -1) {
    return { index: -1, frequency: NaN, distance: NaN };
  }
  return { index: bestIdx, frequency: +freqs[bestIdx], distance: bestDist };
}

module.exports = { argprin: argprin, convolve: convolve, generarFrecuenciasNotas: generarFrecuenciasNotas, frecuenciaMasCercana: frecuenciaMasCercana };

// If running in a browser-like environment, expose on window for convenience
if (typeof window !== 'undefined') {
  try {
    window.AudioMath = module.exports;
  } catch (e) {
    // ignore if assignment fails
  }
}
