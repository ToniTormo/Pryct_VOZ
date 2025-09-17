// START OF UIController.js
(function(){
  function init({engine, effects}) {
    // Buttons and elements
    const startButton = document.getElementById('startButton');
    const playPause = document.getElementById('play-pause');
    const downloadButton = document.getElementById('downloadButton');
    const base = document.getElementById('base');
    const stopButton = document.getElementById('stopButton');
    const playImg = document.getElementById('playImg');
    const startImg = document.getElementById('startImg');
    const stopImg = document.getElementById('stopImg');
    const repro = document.getElementById('repro');
    const bases = document.getElementById('bases');
    const estadoAudio = document.getElementById('estado-audio');

    // Helper toggles
    async function start_stop() {
      if (!engine) return;
      const st = engine.getState();
      if (!st.grabando) {
        if (typeof startImg !== 'undefined') startImg.src = '../img/cuadrado.png';
        await engine.startRecording(effects);
      } else {
        if (typeof startImg !== 'undefined') startImg.src = '../img/micro.png';
        engine.stopRecording();
      }
    }

    if (startButton) startButton.addEventListener('click', start_stop);

    if (playPause) {
      playPause.addEventListener('click', function(){
        // Sync effects live with DOM settings before playing
        if (effects && typeof effects.disconnectRealtime === 'function') effects.disconnectRealtime();
        if (effects && typeof effects.setupRealtime === 'function' && window && window.AudioContext) {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const sourceNode = ctx.createMediaElementSource(repro);
          effects.setupRealtime(ctx, sourceNode);
        }

        if (repro.paused || repro.ended) {
          playImg.src = '../img/pausa2.png';
          repro.play();
        } else {
          playImg.src = '../img/play.png';
          repro.pause();
        }
      });
    }

    if (stopButton) stopButton.addEventListener('click', function(){
      if (base.paused || base.ended) {
        stopImg.src = '../img/pausa2.png';
        base.play();
      } else {
        stopImg.src = '../img/play.png';
        base.pause();
      }
    });

    if (bases) bases.addEventListener('change', function(){
      const opcionSeleccionada = bases.options[bases.selectedIndex].value;
      switch (opcionSeleccionada) {
        case 'Base 1': base.src = '../Audio/Bases/Base1.wav'; stopButton.disabled = false; stopImg.src = '../img/play.png'; break;
        case 'Base 2': base.src = '../Audio/Bases/Base2.wav'; stopButton.disabled = false; stopImg.src = '../img/play.png'; break;
        case 'Base 3': base.src = '../Audio/Bases/Base3.wav'; stopButton.disabled = false; stopImg.src = '../img/play.png'; break;
        default: stopButton.disabled = true; stopImg.src = '../img/play.png'; base.src = ''; break;
      }
    });

    // Time update for main audio preview
    if (repro) repro.addEventListener('timeupdate', function(){
      const audio = repro;
      if (!audio.duration || !audio.currentTime) return;
      let minutos = Math.floor(audio.currentTime / 60);
      let segundos = Math.floor(audio.currentTime % 60);
      let durMin = Math.floor(audio.duration / 60);
      let durSeg = Math.floor(audio.duration % 60);
      if (segundos < 10) segundos = '0' + segundos;
      if (durSeg < 10) durSeg = '0' + durSeg;
      if (estadoAudio) estadoAudio.innerHTML = minutos + ':' + segundos + ' / ' + durMin + ':' + durSeg;
    });

    // Download button wiring: render offline using engine + effects
    if (downloadButton) downloadButton.addEventListener('click', async function(){
      if (!engine) return;
      // Pass effects wiring for offline rendering
      const blob = await engine.render(effects);
      if (!blob) return;
      const a = document.createElement('a');
      a.style.display = 'none';
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = 'grabacion.wav';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      downloadButton.disabled = true;
    });
  }

  if (typeof window !== 'undefined') window.UIController = { init };
  if (typeof module !== 'undefined' && module.exports) module.exports = { init };
})();

// END OF UIController.js
