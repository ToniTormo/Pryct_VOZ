'use strict';

// Lightweight initializer / loader for both Node (CommonJS) and browser environments.
// This file delegates heavy logic to AudioEngine.js, EffectsProcessor.js and UIController.js.

// Attempt to require modules via CommonJS (Node). If require is not available or fails,
// fall back to window globals (browser).
let AudioEngine;
let EffectsProcessor;
let UIController;

try {
  AudioEngine = (typeof require !== 'undefined') ? require('./AudioEngine') : window.AudioEngine;
} catch (err) {
  // If require exists but module not found or other error, fall back to window (if present).
  AudioEngine = (typeof window !== 'undefined') ? window.AudioEngine : undefined;
}

try {
  EffectsProcessor = (typeof require !== 'undefined') ? require('./EffectsProcessor') : window.EffectsProcessor;
} catch (err) {
  EffectsProcessor = (typeof window !== 'undefined') ? window.EffectsProcessor : undefined;
}

try {
  UIController = (typeof require !== 'undefined') ? require('./UIController') : window.UIController;
} catch (err) {
  UIController = (typeof window !== 'undefined') ? window.UIController : undefined;
}

// Initialize wiring between UI and audio/effects modules.
// UIController is responsible for registering DOM event listeners and delegating actions
// to AudioEngine and EffectsProcessor. Do not register event listeners in this file.
if (UIController && typeof UIController.init === 'function') {
  try {
    // Provide references to the audio modules so the UI can wire them up.
    UIController.init({ AudioEngine, EffectsProcessor });
  } catch (initErr) {
    // Initialization errors should be surfaced for debugging, but not crash the app.
    if (typeof console !== 'undefined' && console.error) {
      console.error('UIController.init failed:', initErr);
    }
  }
} else {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('UIController or UIController.init not available. Ensure UIController.js is loaded.');
  }
}

// Expose modules to browser global scope for direct usage/development convenience.
if (typeof window !== 'undefined') {
  try {
    if (typeof AudioEngine !== 'undefined') window.AudioEngine = AudioEngine;
    if (typeof EffectsProcessor !== 'undefined') window.EffectsProcessor = EffectsProcessor;
    if (typeof UIController !== 'undefined') window.UIController = UIController;
    // Also expose a small namespace for convenience
    window.App = window.App || {};
    window.App.AudioEngine = AudioEngine;
    window.App.EffectsProcessor = EffectsProcessor;
    window.App.UIController = UIController;
  } catch (err) {
    // Swallow errors assigning globals in restrictive environments.
  }
}

// Export modules for CommonJS consumers (Node).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioEngine, EffectsProcessor, UIController };
}

// NOTE: Any direct DOM manipulation or event listeners that existed previously in main.js
// have been removed from this entry file. UIController.init is responsible for all UI wiring
// (event listeners, form validation, responsive behaviors, etc.). This keeps a single
// environment-agnostic entry that delegates logic to the modular files.
