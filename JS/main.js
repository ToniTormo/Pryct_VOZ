// main.js - orchestration shim (UMD-aware)
(function() {
  // If running in Node require modules, otherwise rely on window globals provided by script tags
  let AudioEngine, EffectsProcessor, UIController;
  try {
    AudioEngine = require('./AudioEngine.js');
    EffectsProcessor = require('./EffectsProcessor.js');
    UIController = require('./UIController.js');
  } catch (e) {
    // in browser the modules attach to window
    AudioEngine = window.AudioEngine;
    EffectsProcessor = window.EffectsProcessor;
    UIController = window.UIController;
  }

  // Initialize UI controller if available
  if (UIController && typeof UIController.init === 'function') {
    UIController.init({ AudioEngine, EffectsProcessor });
  }

  // Export for Node usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioEngine, EffectsProcessor, UIController };
  }
})();
