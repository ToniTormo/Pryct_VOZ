const AudioMath = require('./AudioMath');

// Higher-level signal processing functions moved from autotune.js
// These functions delegate heavy numeric ops to AudioMath where possible.
// Note: some functions below reference external libraries (numeric, librosa, etc.).
// If those libraries are not present in the Node test environment, tests should
// either stub them or focus on functions that do not require them.

function _validateNumber(name, v) {
  if (typeof v !== 'number' || Number.isNaN(v) || !Number.isFinite(v)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}

function _validateArray(name, arr) {
  if (!Array.isArray(arr)) throw new TypeError(`${name} must be an array`);
}

/**
 * segmentaf0
 * Segment signal into frames and estimate f0 per segment.
 * This is an adapted version that uses AudioMath.convolve for convolution.
 * Many parameters follow the typical values used in pitch tracking.
 */
function segmentaf0(signal, sr, winLenMs = 40, hopFraction = 0.5) {
  try {
    _validateArray('signal', signal);
    _validateNumber('sr', sr);

    const winLenSamples = Math.max(1, Math.round((winLenMs / 1000) * sr));
    const hop = Math.max(1, Math.round(winLenSamples * (1 - hopFraction)));

    const window = new Array(winLenSamples).fill(0).map((_, i) => {
      // Hann window
      return 0.5 * (1 - Math.cos((2 * Math.PI * i) / (winLenSamples - 1)));
    });

    const nFrames = Math.max(0, Math.ceil((signal.length - winLenSamples) / hop) + 1);
    const times = new Array(nFrames);
    const f0 = new Array(nFrames).fill(0);

    for (let frame = 0; frame < nFrames; frame++) {
      const start = frame * hop;
      const frameSignal = signal.slice(start, start + winLenSamples);
      // Zero-pad if needed
      if (frameSignal.length < winLenSamples) {
        for (let k = frameSignal.length; k < winLenSamples; k++) frameSignal.push(0);
      }

      // Apply window
      for (let i = 0; i < winLenSamples; i++) frameSignal[i] *= window[i];

      // Autocorrelation via convolution with time-reversed signal
      // Use AudioMath.convolve which should be optimized in AudioMath module
      const rev = frameSignal.slice().reverse();
      const ac = AudioMath.convolve(frameSignal, rev);

      // Find peak (naive approach) in autocorrelation starting after lag 0
      let maxVal = -Infinity;
      let maxIdx = -1;
      // We start at lag corresponding to about 50Hz and above to avoid spurious large periods
      const minFreq = 50; // Hz
      const maxFreq = 2000; // Hz
      const minLag = Math.max(1, Math.floor(sr / maxFreq));
      const maxLag = Math.max(minLag + 1, Math.ceil(sr / minFreq));
      for (let lag = minLag; lag <= Math.min(maxLag, ac.length - 1); lag++) {
        const val = ac[lag];
        if (val > maxVal) {
          maxVal = val;
          maxIdx = lag;
        }
      }

      const estF0 = maxIdx > 0 ? sr / maxIdx : 0;
      f0[frame] = estF0;
      times[frame] = (start + winLenSamples / 2) / sr;
    }

    return { times, f0 };
  } catch (err) {
    throw err;
  }
}

/**
 * encuentra_fi_espectrograma
 * Search for dominant frequency in a spectrogram-like matrix.
 * Preserves the original structure that might rely on numeric/librosa.
 * spectrogram: 2D array [freqBins][timeFrames]
 * freqs: array of frequency values corresponding to rows
 */
function encuentra_fi_espectrograma(spectrogram, freqs, sr) {
  // This function historically relied on numeric and librosa.
  // We preserve the logic but do minimal validation here.
  try {
    _validateArray('spectrogram', spectrogram);
    _validateArray('freqs', freqs);
    _validateNumber('sr', sr);

    const nFreqs = freqs.length;
    const nTimes = spectrogram[0] ? spectrogram[0].length : 0;

    const fi = new Array(nTimes).fill(0);

    for (let t = 0; t < nTimes; t++) {
      // Find index of maximum magnitude for time frame t
      let maxVal = -Infinity;
      let maxIdx = -1;
      for (let f = 0; f < nFreqs; f++) {
        const val = spectrogram[f][t];
        if (val > maxVal) {
          maxVal = val;
          maxIdx = f;
        }
      }
      fi[t] = freqs[maxIdx] || 0;
    }

    return fi;
  } catch (err) {
    throw err;
  }
}

/**
 * trayectoriaPitch_stft
 * Compute a pitch trajectory using short-time Fourier transform heuristics.
 * Replaces local generarFrecuenciasNotas with AudioMath.generarFrecuenciasNotas
 */
function trayectoriaPitch_stft(signal, sr, n_fft = 2048, hop_length = 512) {
  try {
    _validateArray('signal', signal);
    _validateNumber('sr', sr);

    // Minimal STFT magnitude computation (naive, small frames)
    const win = new Array(n_fft).fill(0).map((_, i) => 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n_fft - 1))));
    const nFrames = Math.max(0, Math.ceil((signal.length - n_fft) / hop_length) + 1);
    const freqs = new Array(Math.floor(n_fft / 2) + 1).fill(0).map((_, k) => (k * sr) / n_fft);

    // Build spectrogram magnitude matrix [freq][time]
    const spectrogram = freqs.map(() => new Array(nFrames).fill(0));

    for (let frame = 0; frame < nFrames; frame++) {
      const start = frame * hop_length;
      const frameSignal = signal.slice(start, start + n_fft);
      if (frameSignal.length < n_fft) {
        for (let k = frameSignal.length; k < n_fft; k++) frameSignal.push(0);
      }
      // Apply window
      for (let i = 0; i < n_fft; i++) frameSignal[i] *= win[i];

      // Use a simple FFT implementation if AudioMath provides one, else fallback to naive DFT
      let spectrumRe;
      let spectrumIm;
      if (AudioMath.fft) {
        const complex = AudioMath.fft(frameSignal);
        spectrumRe = complex.re;
        spectrumIm = complex.im;
      } else {
        // naive DFT for positive freqs only (slow but works for small tests)
        spectrumRe = new Array(n_fft).fill(0);
        spectrumIm = new Array(n_fft).fill(0);
        for (let k = 0; k < n_fft; k++) {
          let re = 0;
          let im = 0;
          for (let n = 0; n < n_fft; n++) {
            const angle = (-2 * Math.PI * k * n) / n_fft;
            re += frameSignal[n] * Math.cos(angle);
            im += frameSignal[n] * Math.sin(angle);
          }
          spectrumRe[k] = re;
          spectrumIm[k] = im;
        }
      }

      const half = Math.floor(n_fft / 2) + 1;
      for (let k = 0; k < half; k++) {
        const mag = Math.sqrt((spectrumRe[k] || 0) ** 2 + (spectrumIm[k] || 0) ** 2);
        spectrogram[k][frame] = mag;
      }
    }

    // Find dominant frequency per time frame
    let fi = encuentra_fi_espectrograma(spectrogram, freqs, sr);

    // Optionally map to musical notes using AudioMath.generarFrecuenciasNotas
    if (AudioMath && typeof AudioMath.generarFrecuenciasNotas === 'function') {
      const noteFreqs = AudioMath.generarFrecuenciasNotas();
      // Map each fi to nearest note (if desired) using AudioMath.frecuenciaMasCercana
      fi = fi.map((f) => {
        if (!f || f <= 0) return 0;
        if (typeof AudioMath.frecuenciaMasCercana === 'function') {
          return AudioMath.frecuenciaMasCercana(f, noteFreqs);
        }
        return f;
      });
    }

    return { times: null, f0: fi, spectrogram, freqs };
  } catch (err) {
    throw err;
  }
}

/**
 * modificaPitch
 * Modify a pitch trajectory by quantizing or shifting.
 * Uses AudioMath.frecuenciaMasCercana to snap to closest allowed frequency.
 */
function modificaPitch(pitchTrajectory, options = {}) {
  try {
    _validateArray('pitchTrajectory', pitchTrajectory);

    const { semitoneShift = 0, snapToNotes = false, allowedFrequencies = null } = options;

    let targetFreqs = allowedFrequencies;
    if (snapToNotes && (!Array.isArray(allowedFrequencies) || allowedFrequencies.length === 0)) {
      if (AudioMath && typeof AudioMath.generarFrecuenciasNotas === 'function') {
        targetFreqs = AudioMath.generarFrecuenciasNotas();
      }
    }

    const out = pitchTrajectory.map((f) => {
      if (!f || f <= 0) return 0;
      // Apply semitone shift: freq * 2^(semitone/12)
      let shifted = f * Math.pow(2, semitoneShift / 12);
      if (snapToNotes && Array.isArray(targetFreqs) && targetFreqs.length > 0) {
        if (typeof AudioMath.frecuenciaMasCercana === 'function') {
          return AudioMath.frecuenciaMasCercana(shifted, targetFreqs);
        }
      }
      return shifted;
    });

    return out;
  } catch (err) {
    throw err;
  }
}

/**
 * autotune
 * High-level wrapper that runs trajectory estimation and modification.
 * Parameters:
 * - signal: audio samples array
 * - sr: sample rate
 * - opts: { n_fft, hop_length, semitoneShift, snapToNotes }
 */
function autotune(signal, sr, opts = {}) {
  try {
    _validateArray('signal', signal);
    _validateNumber('sr', sr);

    const { n_fft = 2048, hop_length = 512, semitoneShift = 0, snapToNotes = false } = opts;

    const traj = trayectoriaPitch_stft(signal, sr, n_fft, hop_length);
    const modified = modificaPitch(traj.f0 || [], { semitoneShift, snapToNotes });

    return {
      originalTrajectory: traj.f0,
      modifiedTrajectory: modified,
      spectrogram: traj.spectrogram,
      freqs: traj.freqs,
    };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  segmentaf0,
  encuentra_fi_espectrograma,
  trayectoriaPitch_stft,
  modificaPitch,
  autotune,
};

// Attach to window for browser environments
if (typeof window !== 'undefined') {
  try {
    if (!window.SignalProcessing) window.SignalProcessing = {};
    Object.assign(window.SignalProcessing, module.exports);
  } catch (e) {
    // ignore in non-browser or restricted envs
  }
}
