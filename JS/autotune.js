// START OF autotune.js
(function(){
  // Import utilities in Node or use global in browser
  const AudioMath = (typeof require === 'function') ? require('./utils/AudioMath') : window.AudioMath;
  const SignalProcessing = (typeof require === 'function') ? require('./utils/SignalProcessing') : window.SignalProcessing;

  async function autotune(audioBuffer) {
    // Keep existing behavior but delegate math and processing to utils
    const fs = 44100;
    const NFFT = 2048;
    const H = 512;
    const fmax = 2000;

    const audioData = audioBuffer.getChannelData(0);

    // Use SignalProcessing.trayectoriaPitch_stft which internally uses AudioMath
    const result = SignalProcessing.trayectoriaPitch_stft(audioData, fs, NFFT, H, fmax);
    const [f0, f0nota, a] = result;

    // Use modificaPitch from SignalProcessing
    const B = 1024;
    const fmin = 100;
    const A_corrected = SignalProcessing.modificaPitch(audioData, fs, B, H, f0, f0nota, fmin);

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const newBuffer = audioContext.createBuffer(1, A_corrected.length, fs);
    const newData = newBuffer.getChannelData(0);
    newData.set(A_corrected);
    return newBuffer;
  }

  if (typeof window !== 'undefined') window.autotune = autotune;
  if (typeof module !== 'undefined' && module.exports) module.exports = autotune;
})();

// END OF autotune.js
