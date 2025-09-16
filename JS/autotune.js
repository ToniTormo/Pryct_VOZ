/* autotune.js - wrapper that composes utils */
(function(root) {
  let AudioMath, SignalProcessing;
  try {
    AudioMath = require('./utils/AudioMath.js');
    SignalProcessing = require('./utils/SignalProcessing.js');
  } catch (e) {
    AudioMath = root.AudioMath;
    SignalProcessing = root.SignalProcessing;
  }

  async function autotune(audioBuffer) {
    // delegates to SignalProcessing.autotune
    if (!SignalProcessing || typeof SignalProcessing.autotune !== 'function') {
      throw new Error('SignalProcessing.autotune not available');
    }
    return SignalProcessing.autotune(audioBuffer, AudioMath);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { autotune };
  } else {
    root.autotune = { autotune };
  }
})(this);
