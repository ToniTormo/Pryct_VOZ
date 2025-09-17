// Minimal bootstrap: expose audioElement and references to new modules
const audioElement = (typeof document !== 'undefined') ? document.getElementById('repro') : null;

// Safely attempt to require CommonJS modules when running under Node / bundler
function tryRequire(path) {
  if (typeof require === 'function' && typeof module !== 'undefined') {
    try {
      return require(path);
    } catch (err) {
      // fail silently so browser globals can be used instead
      return undefined;
    }
  }
  return undefined;
}

let AudioEngine = tryRequire('./AudioEngine');
let EffectsProcessor = tryRequire('./EffectsProcessor');
let UIController = tryRequire('./UIController');

// Fallback to window globals for browser environments
if (typeof window !== 'undefined') {
  if (AudioEngine === undefined) AudioEngine = window.AudioEngine;
  if (EffectsProcessor === undefined) EffectsProcessor = window.EffectsProcessor;
  if (UIController === undefined) UIController = window.UIController;

  // Attach audioElement and module references to window so legacy scripts (info.js, botones.js, etc.) keep working
  try {
    window.audioElement = audioElement;
    window.AudioEngine = AudioEngine;
    window.EffectsProcessor = EffectsProcessor;
    window.UIController = UIController;
  } catch (e) {
    // ignore if window is not writable
  }
}

// Export for CommonJS/Node.js testing environments
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { audioElement, AudioEngine, EffectsProcessor, UIController };
}
