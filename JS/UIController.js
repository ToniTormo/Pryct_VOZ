/* UIController.js - wires UI to AudioEngine and EffectsProcessor */
(function(root) {
  const UI = {};

  UI.init = function(deps) {
    // deps expected: { AudioEngine, EffectsProcessor } (may be undefined in some environments)
    UI.AudioEngine = deps && deps.AudioEngine ? deps.AudioEngine : (window.AudioEngine || null);
    UI.EffectsProcessor = deps && deps.EffectsProcessor ? deps.EffectsProcessor : (window.EffectsProcessor || null);

    // If AudioEngine exists, attach recording button
    const startBtn = document.getElementById('startButton');
    if (startBtn && UI.AudioEngine) {
      startBtn.addEventListener('click', function() { UI.AudioEngine.start_stop(); });
    }

    // Play/pause main audio element
    const playPause = document.getElementById('play-pause');
    const audioElement = document.getElementById('repro');
    const imagenPlay = document.getElementById('playImg');
    if (playPause && audioElement) {
      playPause.addEventListener('click', function() {
        if (audioElement.paused || audioElement.ended) {
          imagenPlay.src = "../img/pausa2.png";
          audioElement.play();
        } else {
          imagenPlay.src = "../img/play.png";
          audioElement.pause();
        }
      });
    }

    // Bases button logic (replaces botones.js)
    const botonBases = document.getElementById('stopButton');
    const base = document.getElementById('base');
    const imagenBases = document.getElementById('stopImg');
    const basesSelect = document.getElementById('bases');

    if (botonBases && base && imagenBases) {
      botonBases.addEventListener('click', function() {
        if (base.paused || base.ended) {
          imagenBases.src = "../img/pausa2.png";
          base.play();
        } else {
          imagenBases.src = "../img/play.png";
          base.pause();
        }
      });
    }

    if (document.getElementById('startButton')) {
      document.getElementById('startButton').addEventListener('click', function() {
        base.pause();
        imagenBases.src = "../img/play.png";
        botonBases.disabled = true;
      });
    }

    if (audioElement) {
      audioElement.addEventListener('timeupdate', function() {
        const minutos = Math.floor(audioElement.currentTime / 60);
        let segundos = Math.floor(audioElement.currentTime % 60);
        const duracionMinutos = Math.floor(audioElement.duration / 60) || 0;
        let duracionSegundos = Math.floor(audioElement.duration % 60) || 0;
        if (segundos < 10) segundos = '0' + segundos;
        if (duracionSegundos < 10) duracionSegundos = '0' + duracionSegundos;
        document.getElementById('estado-audio').innerHTML = minutos + ':' + segundos + ' / ' + duracionMinutos + ':' + duracionSegundos;
      });
    }

    if (basesSelect && base) {
      basesSelect.addEventListener('change', function() {
        const opcionSeleccionada = basesSelect.options[basesSelect.selectedIndex].value;
        switch (opcionSeleccionada) {
          case 'Base 1': base.src = "../Audio/Bases/Base1.wav"; imagenBases.src = "../img/play.png"; botonBases.disabled = false; break;
          case 'Base 2': base.src = "../Audio/Bases/Base2.wav"; imagenBases.src = "../img/play.png"; botonBases.disabled = false; break;
          case 'Base 3': base.src = "../Audio/Bases/Base3.wav"; imagenBases.src = "../img/play.png"; botonBases.disabled = false; break;
          default: imagenBases.src = "../img/play.png"; botonBases.disabled = true; break;
        }
      });
    }

    // Wire effect sliders: update displays and update EffectsProcessor nodes when buffer ready
    const echo = document.getElementById('valueEcho');
    const spanEcho = document.getElementById('spanEcho');
    if (echo && spanEcho) {
      echo.addEventListener('input', function() { spanEcho.textContent = this.value * 1000 + ' ms';
        if (UI.EffectsProcessor) { UI.EffectsProcessor.eco(); UI.EffectsProcessor.aplicar_efectos(); }
      });
    }

    const Chorus = document.getElementById('valueChorus');
    const spanChorus = document.getElementById('spanChorus');
    if (Chorus && spanChorus) {
      Chorus.addEventListener('input', function() {
        spanChorus.textContent = this.value == 1 ? this.value + ' voz' : this.value + ' voces';
        if (UI.EffectsProcessor) { UI.EffectsProcessor.chorus(); UI.EffectsProcessor.aplicar_efectos(); }
      });
    }

    const Reverb = document.getElementById('valueReverb');
    const spanReverb = document.getElementById('spanReverb');
    if (Reverb && spanReverb) {
      Reverb.addEventListener('input', function() {
        spanReverb.textContent = this.value;
        if (UI.EffectsProcessor) { UI.EffectsProcessor.reverb(); UI.EffectsProcessor.aplicar_efectos(); }
      });
    }

    // Listen for buffer ready event from AudioEngine to configure EffectsProcessor
    document.addEventListener('AudioEngine:bufferReady', function(ev) {
      const audioBuffer = ev.detail && ev.detail.audioBuffer;
      if (!audioBuffer) return;
      // Initialize EffectsProcessor contexts
      if (UI.EffectsProcessor && UI.AudioEngine) {
        UI.EffectsProcessor.initContext(UI.AudioEngine.ctx, UI.AudioEngine.offlineContext);
        // Set EffectsProcessor.sourceNode to the media element source to allow live preview
        const audioElement = document.getElementById('repro');
        if (audioElement && UI.AudioEngine && UI.AudioEngine.ctx) {
          try { UI.EffectsProcessor.sourceNode = UI.AudioEngine.ctx.createMediaElementSource(audioElement); } catch(e) {}
        }
        // Create effects nodes and apply
        UI.EffectsProcessor.chorus();
        UI.EffectsProcessor.eco();
        UI.EffectsProcessor.reverb();
        UI.EffectsProcessor.aplicar_efectos();
      }
    });

    // Download button: call EffectsProcessor.render when available
    const downloadBtn = document.getElementById('downloadButton');
    if (downloadBtn && UI.EffectsProcessor && UI.AudioEngine) {
      downloadBtn.addEventListener('click', async function() {
        downloadBtn.disabled = true;
        const blob = await UI.EffectsProcessor.render(UI.AudioEngine.audioBuffer, UI.AudioEngine.offlineContext);
        if (blob) {
          const a = document.createElement('a');
          a.style.display = 'none';
          const url = window.URL.createObjectURL(blob);
          a.href = url;
          a.download = 'grabacion.wav';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        downloadBtn.disabled = true; // original behaviour disables after download
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
  } else {
    root.UIController = UI;
  }
})(this);
