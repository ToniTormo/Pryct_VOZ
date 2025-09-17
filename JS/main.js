// START OF NEW main.js (replace whole file)
(function(){
  // Resolve modules in Node (require) or Browser (window)
  const AudioEngine = (typeof require === 'function') ? require('./AudioEngine') : window.AudioEngine;
  const EffectsProcessor = (typeof require === 'function') ? require('./EffectsProcessor') : window.EffectsProcessor;
  const UIController = (typeof require === 'function') ? require('./UIController') : window.UIController;

  // If modules export a factory, create instances, otherwise use exported objects
  const engine = AudioEngine && (typeof AudioEngine.create === 'function' ? AudioEngine.create() : AudioEngine);
  const effects = EffectsProcessor && (typeof EffectsProcessor.create === 'function' ? EffectsProcessor.create() : EffectsProcessor);

  // Init UI controller which wires DOM events to engine and effects
  if (UIController && typeof UIController.init === 'function') {
    UIController.init({engine, effects});
  } else {
    console.warn('UIController.init not found. Ensure JS/ UIController.js is loaded.');
  }

  // Expose for browser console debugging
  if (typeof window !== 'undefined') {
    window.__Pryct = { engine, effects };
  }

  // Export for Node environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { engine, effects };
  }
})();

// END OF NEW main.js
