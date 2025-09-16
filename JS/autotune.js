// autotune.js - thin wrapper that re-exports SignalProcessing.autotune
const AudioMath = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./utils/AudioMath') : window.AudioMath;
const SignalProcessing = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./utils/SignalProcessing') : window.SignalProcessing;

function autotune(audioBuffer) {
  if (!SignalProcessing || !SignalProcessing.autotune) throw new Error('SignalProcessing.autotune not available');
  return SignalProcessing.autotune(audioBuffer);
}

if (typeof module !== 'undefined' && module.exports) module.exports = { autotune };
if (typeof window !== 'undefined') window.autotune = autotune;
