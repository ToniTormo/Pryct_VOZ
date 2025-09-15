// Module loading for Node.js + browser fallback
let AudioEngineModule, EffectsModule, UIControllerModule;
if (typeof require === 'function') {
  try {
    AudioEngineModule = require('./AudioEngine');
  } catch (e) {}
  try {
    EffectsModule = require('./EffectsProcessor');
  } catch (e) {}
  try {
    UIControllerModule = require('./UIController');
  } catch (e) {}
} else {
  // Browser: modules attach themselves to window in new files
  AudioEngineModule = window.AudioEngine;
  EffectsModule = window.EffectsProcessor;
  UIControllerModule = window.UIController;
}

// Variables globales
let audioStream;
let audioRecorder;
let mediaRecorder;
const audioElement = document.getElementById('repro'); // Obtener el elemento reproductor
var audio = document.getElementById('repro');
let ctx;
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
async function startRecording() {
  if (AudioEngineModule && typeof AudioEngineModule.startRecording === 'function') {
    return AudioEngineModule.startRecording({
      ctxRef: () => ctx,
      setCtx: c => { ctx = c; },
      audioElementRef: () => audioElement,
      setSourceNode: s => { sourceNode = s; },
      getSourceNode: () => sourceNode,
      setAudioBuffer: b => { audioBuffer = b; },
      getAudioBuffer: () => audioBuffer
    }, EffectsModule);
  } else {
    console.warn('AudioEngineModule.startRecording not available');
  }
}

// Función para detener la grabación
async function stopRecording() {
  if (AudioEngineModule && typeof AudioEngineModule.stopRecording === 'function') {
    return AudioEngineModule.stopRecording();
  } else {
    // fallback to original behaviour if needed
    if (mediaRecorder) mediaRecorder.stop();
    if (audioStream) audioStream.getTracks().forEach(track => track.stop());
    document.getElementById('startButton').disabled = false;
    document.getElementById('downloadButton').disabled = false;
    document.getElementById('stopButton').disabled = false;
  }
}

function start_stop(){
  if (AudioEngineModule && typeof AudioEngineModule.start_stop === 'function') {
    return AudioEngineModule.start_stop({
      setGrabando: v => { grabando = v; },
      getGrabando: () => grabando,
      setStartImg: src => { document.getElementById('startImg').src = src; }
    });
  } else {
    if (grabando == false){
      document.getElementById('startImg').src = "../img/cuadrado.png";
      startRecording();
      grabando = true;
    } else {
      document.getElementById('startImg').src = "../img/micro.png";
      stopRecording();
      grabando = false;
    }
  }
}

// Iniciar grabación al hacer clic en el botón "Comenzar grabación"
document.getElementById('startButton').addEventListener('click', start_stop);

function eco(){
  if (EffectsModule && typeof EffectsModule.eco === 'function') {
    return EffectsModule.eco({ ctxRef: () => ctx, offlineContextRef: () => offlineContext });
  }
}

function reverb(){
  if (EffectsModule && typeof EffectsModule.reverb === 'function') {
    return EffectsModule.reverb({ ctxRef: () => ctx, offlineContextRef: () => offlineContext });
  }
}

function aplicar_efectos(){
  if (EffectsModule && typeof EffectsModule.aplicar_efectos === 'function') {
    return EffectsModule.aplicar_efectos({
      sourceNodeRef: () => sourceNode,
      ctxRef: () => ctx,
      retardoRef: () => retardo,
      feedRef: () => feed,
      revdelayRef: () => revdelay,
      revgainRef: () => revgain,
      chor_delaysRef: () => chor_delays,
      chor_gainsRef: () => chor_gains
    });
  }
}

// Función de modulación
function modulationFunction(modDepth,modFreq,time) {
  if (EffectsModule && typeof EffectsModule.modulationFunction === 'function') {
    return EffectsModule.modulationFunction(modDepth,modFreq,time);
  }
  return Math.sin(2 * Math.PI * modFreq * time) * modDepth;
}
//Chorus
function chorus(){
  if (EffectsModule && typeof EffectsModule.chorus === 'function') {
    return EffectsModule.chorus({ ctxRef: () => ctx, offlineContextRef: () => offlineContext, modulationFunction: modulationFunction });
  }
}

function desconectar(){
  if (EffectsModule && typeof EffectsModule.desconectar === 'function') {
    return EffectsModule.desconectar({
      sourceNodeRef: () => sourceNode,
      chor_delaysRef: () => chor_delays,
      chor_gainsRef: () => chor_gains,
      retardoRef: () => retardo,
      feedRef: () => feed,
      revdelayRef: () => revdelay,
      revgainRef: () => revgain
    });
  }
}
document.getElementById("play-pause").addEventListener('click', function(){
  desconectar();
  chorus();
  eco();
  reverb();
  aplicar_efectos();
  if (audioElement.paused || audioElement.ended) {
    audioElement.play();

} else {
    audioElement.pause();

}
}
);

async function render(){
  if (AudioEngineModule && typeof AudioEngineModule.render === 'function') {
    return AudioEngineModule.render({
      offlineContextRef: () => offlineContext,
      offlineSourceRef: () => offlineSource,
      audioBufferRef: () => audioBuffer,
      setWavBlob: b => { wavBlob = b; },
      aplicar_efectos: aplicar_efectos,
      desconectar: desconectar,
      bufferToWave: bufferToWave
    });
  }
}


document.getElementById('downloadButton').onclick = async function() {
  await render();
  audioUrl='';    
  const a = document.createElement('a');
  a.style.display = 'none';
  // const blob = new Blob(down, { type: mediaRecorder.mimeType });
  audioUrl = window.URL.createObjectURL(wavBlob);
  a.href = audioUrl;
  a.download = 'grabacion.wav';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(audioUrl);
  document.body.removeChild(a);
  document.getElementById('downloadButton').disabled=true;
};

function bufferToWave(abuffer) {
  if (AudioEngineModule && typeof AudioEngineModule.bufferToWave === 'function') {
    return AudioEngineModule.bufferToWave(abuffer);
  }
  // fallback: original implementation
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // Write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this demo)

  // Write interleaved data
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = sample * 32767.5; // scale to 16-bit signed int
      view.setInt16(pos, sample, true); // write 16-bit sample
      pos += 2;
    }
    offset++; // next source sample
  }
  return new Blob([buffer], { type: "audio/wav" });
}

