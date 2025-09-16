
// Module import shim (works in Node and browser)
const AudioEngine = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./AudioEngine') : window.AudioEngine;
const EffectsProcessor = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./EffectsProcessor') : window.EffectsProcessor;
const UIController = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./UIController') : window.UIController;
// Variables globales
let audioStream;
let audioRecorder;
let mediaRecorder;
let ctx;
// Bridge calls used by UI and other scripts
// expose audioElement for other modules
const audioElement = document.getElementById('repro');
if (typeof window !== 'undefined') {
  window.audioElement = audioElement;
}

// Initialize modules with references to shared objects (if modules expose init)
if (AudioEngine && AudioEngine.init) AudioEngine.init({ audioElement, EffectsProcessor });
if (EffectsProcessor && EffectsProcessor.init) EffectsProcessor.init({ audioElement });
if (UIController && UIController.init) UIController.init({ AudioEngine, EffectsProcessor, audioElement });

// Rebind download button to the new API
const downloadButton = document.getElementById('downloadButton');
if (downloadButton) {
  downloadButton.addEventListener('click', async function () {
    // ask AudioEngine to render offline and return a Blob
    if (AudioEngine && AudioEngine.renderAndGetWavBlob) {
      downloadButton.disabled = true;
      const wavBlob = await AudioEngine.renderAndGetWavBlob();
      const a = document.createElement('a');
      a.style.display = 'none';
      const audioUrl = window.URL.createObjectURL(wavBlob);
      a.href = audioUrl;
      a.download = 'grabacion.wav';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(audioUrl);
      document.body.removeChild(a);
    }
  });
}
var sourceNode;
var Puerta_ruido;
var retardo;
var feed;
var chor_delays = [];
var chor_gains=[];
var Puerta_ruidooff;
var retardooff;
var feedoff;
var chor_delaysoff = [];
var chor_gainsoff=[];
var grabando = false;
var audioUrl;
var offlineContext;
var offlineSource;
var audioBuffer;
var wavBlob;
var revdelay;
var revdelayoff;
var revgain;
var revgainoff;
document.getElementById('startButton').disabled = false;

// Función para iniciar la grabación



// Iniciar grabación al hacer clic en el botón "Comenzar grabación"




// Función de modulación
//Chorus






