// UIController.js - sets up button listeners and UI interactions
(function(global){
  function init() {
    const audio = document.getElementById('repro');
    const botonPlayPause = document.getElementById('play-pause');
    const botonBases = document.getElementById('stopButton');
    const estadoAudio = document.getElementById('estado-audio');
    const imagenPlay = document.getElementById('playImg');
    const imagenBases = document.getElementById('stopImg');
    const bases = document.getElementById('bases');
    const base = document.getElementById('base');

    botonPlayPause.addEventListener('click', function() {
      if (audio.paused || audio.ended) {
        imagenPlay.src = "../img/pausa2.png";
      } else {
        imagenPlay.src = "../img/play.png";
      }
    });

    botonBases.addEventListener('click', function() {
      if (base.paused || base.ended) {
        imagenBases.src = "../img/pausa2.png";
        base.play();
      } else {
        imagenBases.src = "../img/play.png";
        base.pause();
      }
    });

    document.getElementById('startButton').addEventListener('click', function(){
      base.pause();
      imagenBases.src = "../img/play.png";
      botonBases.disabled = true;
    });

    audio.addEventListener('timeupdate', function() {
      let minutos = Math.floor(audio.currentTime / 60);
      let segundos = Math.floor(audio.currentTime % 60);
      let duracionMinutos = Math.floor(audio.duration / 60) || 0;
      let duracionSegundos = Math.floor(audio.duration % 60) || 0;
      if (segundos < 10) segundos = '0' + segundos;
      if (duracionSegundos < 10) duracionSegundos = '0' + duracionSegundos;
      estadoAudio.innerHTML = minutos + ':' + segundos + ' / ' + duracionMinutos + ':' + duracionSegundos;
    });

    bases.addEventListener('change', function(){
      var opcionSeleccionada = bases.options[bases.selectedIndex].value;
      switch (opcionSeleccionada) {
        case "Base 1":
          base.src = "../Audio/Bases/Base1.wav";
          imagenBases.src = "../img/play.png";
          botonBases.disabled = false;
          break;
        case "Base 2":
          base.src = "../Audio/Bases/Base2.wav";
          imagenBases.src = "../img/play.png";
          botonBases.disabled = false;
          break;
        case "Base 3":
          base.src = "../Audio/Bases/Base3.wav";
          imagenBases.src = "../img/play.png";
          botonBases.disabled = false;
          break;
        default:
          imagenBases.src = "../img/play.png";
          botonBases.disabled = true;
          break;
      }
    });
  }

  // Export for Node / CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init };
  }
  // Attach to window for the browser
  if (typeof window !== 'undefined') {
    window.UIController = { init };
    // init automatically when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})(typeof window !== 'undefined' ? window : global);
