/* SignalProcessing.js
   Extracted signal-processing helpers from autotune.js
   Provides: segmentaf0, encuentra_fi_espectrograma, trayectoriaPitch_stft, modificaPitch
   Depends on a global or required AudioMath which must provide argprin and convolve.
   Numeric and librosa (if used) must remain global as in original environment.
*/

const AudioMath = (typeof require === 'function' && typeof module !== 'undefined') ? require('./AudioMath') : window.AudioMath;

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(AudioMath);
  } else {
    // Browser global
    root.SignalProcessing = factory(AudioMath);
  }
}(typeof self !== 'undefined' ? self : this, function (AudioMathLocal) {
  'use strict';

  // Defensive reference to AudioMath
  const AM = AudioMathLocal || (typeof AudioMath !== 'undefined' ? AudioMath : null);
  if (!AM) {
    // We don't throw here: functions will check AM when needed.
  }

  // Helper: simple validation for arrays
  function _isNumberArray(a) {
    return Array.isArray(a) && a.every(function (v) { return typeof v === 'number'; });
  }

  // segmentaf0: segment a fundamental frequency trajectory into contiguous voiced segments
  // af0t: array of f0 estimates (Hz), zeros or NaN indicate unvoiced
  // ventana: minimum length of a segment in samples (optional)
  // umbral: minimum f0 to consider voiced (optional)
  // minfreq, maxfreq: constraints on f0 values (optional)
  function segmentaf0(af0t, ventana, umbral, minfreq, maxfreq) {
    if (!Array.isArray(af0t)) throw new TypeError('segmentaf0: af0t must be an array');
    ventana = typeof ventana === 'number' ? Math.max(1, Math.floor(ventana)) : 1;
    umbral = typeof umbral === 'number' ? umbral : 1e-6;
    minfreq = typeof minfreq === 'number' ? minfreq : 0;
    maxfreq = typeof maxfreq === 'number' ? maxfreq : Infinity;

    const segments = [];
    let inSeg = false;
    let segStart = 0;

    for (let i = 0; i < af0t.length; i++) {
      const v = af0t[i];
      const isVoiced = (typeof v === 'number' && isFinite(v) && v > umbral && v >= minfreq && v <= maxfreq);

      if (isVoiced) {
        if (!inSeg) {
          inSeg = true;
          segStart = i;
        }
      } else {
        if (inSeg) {
          const segEnd = i - 1;
          const segLen = segEnd - segStart + 1;
          if (segLen >= ventana) {
            // compute representative f0 for the segment
            const segArray = af0t.slice(segStart, segEnd + 1).filter(function (x) { return typeof x === 'number' && isFinite(x) && x > 0; });
            let meanf0 = 0;
            if (segArray.length) {
              try {
                // prefer AudioMath.argprin if available for robust principal frequency
                if (AM && typeof AM.argprin === 'function') {
                  meanf0 = AM.argprin(segArray);
                } else {
                  meanf0 = segArray.reduce(function (a, b) { return a + b; }, 0) / segArray.length;
                }
              } catch (e) {
                meanf0 = segArray.reduce(function (a, b) { return a + b; }, 0) / segArray.length;
              }
            }
            segments.push({ inicio: segStart, fin: segEnd, mediaf0: meanf0 });
          }
          inSeg = false;
        }
      }
    }

    // close trailing segment
    if (inSeg) {
      const segEnd = af0t.length - 1;
      const segLen = segEnd - segStart + 1;
      if (segLen >= ventana) {
        const segArray = af0t.slice(segStart, segEnd + 1).filter(function (x) { return typeof x === 'number' && isFinite(x) && x > 0; });
        let meanf0 = 0;
        if (segArray.length) {
          try {
            if (AM && typeof AM.argprin === 'function') {
              meanf0 = AM.argprin(segArray);
            } else {
              meanf0 = segArray.reduce(function (a, b) { return a + b; }, 0) / segArray.length;
            }
          } catch (e) {
            meanf0 = segArray.reduce(function (a, b) { return a + b; }, 0) / segArray.length;
          }
        }
        segments.push({ inicio: segStart, fin: segEnd, mediaf0: meanf0 });
      }
    }

    return segments;
  }

  // encuentra_fi_espectrograma: find frequency bin index (or frequency) for each frame in a spectrogram
  // S: 2D array [freqBins][timeFrames] of magnitudes (or complex mags). Returns array of indices of peak per frame.
  function encuentra_fi_espectrograma(S) {
    if (!Array.isArray(S) || !S.length) throw new TypeError('encuentra_fi_espectrograma: S must be a 2D array');

    const nBins = S.length;
    const nFrames = (Array.isArray(S[0]) ? S[0].length : 0);
    const peaks = new Array(nFrames).fill(0);

    for (let t = 0; t < nFrames; t++) {
      let maxVal = -Infinity;
      let maxIdx = 0;
      for (let f = 0; f < nBins; f++) {
        const col = S[f];
        const v = Array.isArray(col) ? col[t] : undefined;
        const val = (typeof v === 'number' && isFinite(v)) ? v : 0;
        if (val > maxVal) {
          maxVal = val;
          maxIdx = f;
        }
      }
      peaks[t] = maxIdx;
    }

    return peaks;
  }

  // trayectoriaPitch_stft: generate a pitch trajectory across frames, with optional smoothing via AudioMath.convolve
  // candidates: array of candidate frequencies (per frame) or a single array of fs values
  // win: smoothing window length (samples/frames)
  function trayectoriaPitch_stft(candidates, win) {
    if (!Array.isArray(candidates)) throw new TypeError('trayectoriaPitch_stft: candidates must be an array');
    win = typeof win === 'number' ? Math.max(1, Math.floor(win)) : 1;

    // If candidates is an array of arrays (multiple candidates per frame), pick the first non-zero
    const n = candidates.length;
    const pitch = new Array(n);

    for (let i = 0; i < n; i++) {
      const c = candidates[i];
      if (Array.isArray(c)) {
        // pick the largest candidate value in that frame
        let best = 0;
        for (let j = 0; j < c.length; j++) {
          const val = c[j];
          if (typeof val === 'number' && isFinite(val) && val > best) best = val;
        }
        pitch[i] = best || 0;
      } else {
        const val = typeof c === 'number' && isFinite(c) ? c : 0;
        pitch[i] = val;
      }
    }

    // optional smoothing via convolution using AudioMath.convolve if available
    try {
      if (AM && typeof AM.convolve === 'function' && win > 1) {
        // build a simple moving average window
        const h = new Array(win).fill(1.0 / win);
        const conv = AM.convolve(pitch, h);
        // convolve may return longer array; center to original length
        const start = Math.floor((conv.length - pitch.length) / 2);
        const out = pitch.slice();
        for (let i = 0; i < pitch.length; i++) {
          const idx = i + start;
          if (idx >= 0 && idx < conv.length) out[i] = conv[idx];
        }
        return out;
      }
    } catch (e) {
      // fall back to unsmoothed pitch if convolution fails
    }

    return pitch;
  }

  // modificaPitch: modify a pitch trajectory according to a mapping or shift (e.g., apply cents or semitone shift)
  // pitch: array of f0 values (Hz)
  // modifier: either a function(f0, i) -> newF0 or a numeric factor (multiply) or semitone shift in cents if options.cents = true
  // options: { cents: boolean } if true and modifier is number treat modifier as cents to shift
  function modificaPitch(pitch, modifier, options) {
    if (!Array.isArray(pitch)) throw new TypeError('modificaPitch: pitch must be an array');
    options = options || {};

    const out = new Array(pitch.length);
    const isFunc = typeof modifier === 'function';
    const isNumber = typeof modifier === 'number';

    for (let i = 0; i < pitch.length; i++) {
      const f = pitch[i];
      if (!(typeof f === 'number' && isFinite(f) && f > 0)) {
        out[i] = 0;
        continue;
      }

      if (isFunc) {
        try {
          const m = modifier(f, i);
          out[i] = (typeof m === 'number' && isFinite(m)) ? m : f;
        } catch (e) {
          out[i] = f;
        }
      } else if (isNumber) {
        if (options.cents) {
          // modifier interpreted as cents shift
          const factor = Math.pow(2, modifier / 1200.0);
          out[i] = f * factor;
        } else {
          // numeric multiply factor
          out[i] = f * modifier;
        }
      } else {
        // unrecognized modifier, copy input
        out[i] = f;
      }
    }

    return out;
  }

  // Exported API
  const API = {
    segmentaf0: segmentaf0,
    encuentra_fi_espectrograma: encuentra_fi_espectrograma,
    trayectoriaPitch_stft: trayectoriaPitch_stft,
    modificaPitch: modificaPitch
  };

  return API;
}));