// autotune.js - wrapper exposing autotune using utils/AudioMath and utils/SignalProcessing
(function(global){
  let AudioMath, SignalProcessing;
  if (typeof require === 'function') {
    try { AudioMath = require('./utils/AudioMath'); } catch(e) {}
    try { SignalProcessing = require('./utils/SignalProcessing'); } catch(e) {}
  } else {
    AudioMath = window.AudioMath;
    SignalProcessing = window.SignalProcessing;
  }

  async function autotune(audioBuffer) {
    if (SignalProcessing && typeof SignalProcessing.autotune === 'function') {
      return SignalProcessing.autotune(audioBuffer);
    } else {
      console.warn('SignalProcessing.autotune not available');
      return audioBuffer;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { autotune };
  }
  if (typeof window !== 'undefined') {
    window.autotune = autotune;
  }
})(typeof window !== 'undefined' ? window : global);
