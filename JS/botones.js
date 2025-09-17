// START OF botones.js (compat shim)
(function(){
  if (typeof window !== 'undefined' && window.UIController && typeof window.UIController.init === 'function') {
    // UIController will attach handlers - do nothing here
    console.log('UIController detected - botones.js acting as no-op shim');
  } else {
    // If UIController not present (older setup), keep previous minimal behavior
    try {
      var audio = document.getElementById('repro');
      var botonPlayPause = document.getElementById('play-pause');
      var botonBases = document.getElementById('stopButton');
      var imagenPlay = document.getElementById('playImg');
      var imagenBases = document.getElementById('stopImg');
      var bases = document.getElementById('bases');
      var base = document.getElementById('base');
      if (botonPlayPause) botonPlayPause.addEventListener('click', function() { if (audio.paused || audio.ended) imagenPlay.src = '../img/pausa2.png'; else imagenPlay.src = '../img/play.png'; });
      if (botonBases) botonBases.addEventListener('click', function() { if (base.paused || base.ended) { imagenBases.src = '../img/pausa2.png'; base.play(); } else { imagenBases.src = '../img/play.png'; base.pause(); } });
      if (bases) bases.addEventListener('change', function(){ var opcionSeleccionada = bases.options[bases.selectedIndex].value; switch (opcionSeleccionada) { case 'Base 1': base.src = '../Audio/Bases/Base1.wav'; imagenBases.src = '../img/play.png'; botonBases.disabled=false; break; case 'Base 2': base.src = '../Audio/Bases/Base2.wav'; imagenBases.src = '../img/play.png'; botonBases.disabled=false; break; case 'Base 3': base.src = '../Audio/Bases/Base3.wav'; imagenBases.src = '../img/play.png'; botonBases.disabled=false; break; default: imagenBases.src = '../img/play.png'; botonBases.disabled=true; break; } });
    } catch(e) { console.warn('botones.js shim error', e); }
  }
})();

// END OF botones.js
