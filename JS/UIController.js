(function (global) {
  const UIController = {};

  UIController.init = function ({ AudioEngine: AE, EffectsProcessor: EP, audioElement } = {}) {
    // store references if needed
    if (AE) window.AudioEngine = AE; // ensure global for EffectsProcessor fallback
    if (EP) window.EffectsProcessor = EP;
    if (audioElement) window.audioElement = audioElement;

    // wire start button
    const startButton = document.getElementById('startButton');
    if (startButton) {
      startButton.addEventListener('click', async function () {
        if (AE && AE.start_stop) {
          await AE.start_stop();
        }
      });
    }

    // play/pause main audio with effect re-application
    const playPause = document.getElementById('play-pause');
    if (playPause) {
      playPause.addEventListener('click', function () {
        if (EP && EP.desconectar && EP.chorus && EP.eco && EP.reverb && EP.aplicar_efectos) {
          EP.desconectar();
          EP.chorus();
          EP.eco();
          EP.reverb();
          EP.aplicar_efectos();
        }
        const audioEl = document.getElementById('repro');
        if (audioEl.paused || audioEl.ended) audioEl.play(); else audioEl.pause();
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = UIController;
  if (typeof global !== 'undefined') global.UIController = UIController;
}(typeof window !== 'undefined' ? window : global));
